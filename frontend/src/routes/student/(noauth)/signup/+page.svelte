<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { resolve } from '$app/paths';

    let { form } = $props();
</script>

<div class="flex min-h-full items-center justify-center">
    <div class="w-full max-w-sm space-y-6">
        <h1 class="text-2xl font-semibold">Sign Up</h1>

        <form method="POST" use:enhance class="space-y-4">
            <Input name="username" placeholder="Username" required />
            {#if form?.error}
                <p class="text-sm text-destructive">{form.error}</p>
            {/if}
            <Button type="submit" class="w-full">Sign Up</Button>
        </form>

        <p class="text-center text-sm text-muted-foreground">
            Already have an account? <a href={resolve('/student/login')} class="underline">Login</a>
        </p>
    </div>
</div>
