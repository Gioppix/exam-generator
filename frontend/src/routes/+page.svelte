<script lang="ts">
    import Blend from '@lucide/svelte/icons/blend';
</script>

<div class="flex flex-col items-center gap-16 py-16">
    <div class="flex flex-col items-center gap-3 text-center">
        <div class="flex items-center gap-3">
            <Blend size={40} />
            <h1 class="text-4xl font-bold tracking-tight">Background Annihilator</h1>
        </div>
        <p class="text-xl text-gray-600">
            Removes backgrounds. Flips images. A tool you can count on.
        </p>
        <p class="text-gray-400">You're welcome.</p>
    </div>

    <div class="grid w-full grid-cols-2 items-stretch gap-6">
        <blockquote
            class="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-8"
        >
            <p class="text-lg leading-relaxed text-gray-700 italic">
                “My workflow went from two steps to just one! Crazy right? I'm saving at least 4
                minutes A MONTH”
            </p>
            <footer class="mt-6 text-right text-sm text-gray-400">
                <span class="font-medium text-gray-600">John Doe</span>, Acme Corp
            </footer>
        </blockquote>
    </div>
</div>
