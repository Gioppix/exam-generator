<script lang="ts">
    let { data } = $props();
</script>

<div class="max-w-sm space-y-6">
    <h1 class="text-2xl font-semibold">Me</h1>

    <dl class="space-y-3">
        <div>
            <dt class="text-sm text-muted-foreground">Username</dt>
            <dd class="font-medium">{data.me.username}</dd>
        </div>
        <div>
            <dt class="text-sm text-muted-foreground">Grade Level</dt>
            <dd class="font-medium">{data.me.grade_level ?? '—'}</dd>
        </div>
        <div>
            <dt class="text-sm text-muted-foreground">Country</dt>
            <dd class="font-medium">{data.me.country ?? '—'}</dd>
        </div>
    </dl>
</div>
