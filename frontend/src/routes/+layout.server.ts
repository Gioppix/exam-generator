export async function load({ cookies }) {
    return { student_id: cookies.get('student_id') ?? null };
}
