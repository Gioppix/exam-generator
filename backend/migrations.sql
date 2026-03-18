CREATE TABLE topics
(
    topic_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_topic_id uuid REFERENCES topics (topic_id),
    label           text NOT NULL
);

CREATE TABLE students
(
    student_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username    text NOT NULL UNIQUE,
    grade_level text,
    country     text
);

-- no deletes on this table; updates are limited to `active` column
CREATE TABLE questions
(
    question_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    active      boolean NOT NULL DEFAULT TRUE, -- used to deactivate the question when it gets updated (can't be deleted)
    title       text    NOT NULL,
    question    jsonb   NOT NULL,
    answer      jsonb   NOT NULL
);

CREATE TABLE question_topics
(
    question_id uuid NOT NULL REFERENCES questions (question_id),
    topic_id    uuid NOT NULL REFERENCES topics (topic_id),
    PRIMARY KEY (question_id, topic_id)
);

CREATE TABLE exams
(
    exam_id      uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    student_id   uuid        NOT NULL REFERENCES students (student_id),
    created_at   timestamptz NOT NULL DEFAULT NOW(),
    started_at   timestamptz,
    submitted_at timestamptz,
    graded_at    timestamptz,
    grade        float
);

CREATE TABLE exam_questions
(
    exam_id         uuid NOT NULL REFERENCES exams (exam_id),
    question_id     uuid NOT NULL REFERENCES questions (question_id),
    reported_at     timestamptz, -- if the student thinks the question is "bad" and decides to report it
    answer          jsonb, -- student's answer
    grade           float CHECK (grade BETWEEN 0 AND 1),
    grading_comment text,
    PRIMARY KEY (exam_id, question_id)
);
