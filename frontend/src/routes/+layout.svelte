<script lang="ts">
    import './layout.css';
    import * as Sidebar from '$lib/components/ui/sidebar/index.js';
    import { resolve } from '$app/paths';

    let { children } = $props();
</script>

<Sidebar.Provider class="h-dvh">
    <Sidebar.Root collapsible="none" class="h-full">
        <Sidebar.Header>
            <span class="px-2 text-sm font-semibold">Exam Generator</span>
        </Sidebar.Header>
        <Sidebar.Content>
            <Sidebar.Group>
                <Sidebar.GroupLabel>Admin</Sidebar.GroupLabel>
                <Sidebar.GroupContent>
                    <Sidebar.Menu>
                        <Sidebar.MenuItem>
                            <Sidebar.MenuButton>
                                {#snippet child({ props })}
                                    <a href={resolve('/admin/topics')} {...props}>Topics</a>
                                {/snippet}
                            </Sidebar.MenuButton>
                        </Sidebar.MenuItem>
                    </Sidebar.Menu>
                </Sidebar.GroupContent>
            </Sidebar.Group>
        </Sidebar.Content>
    </Sidebar.Root>

    <Sidebar.Inset class="overflow-y-auto p-4">
        {@render children()}
    </Sidebar.Inset>
</Sidebar.Provider>
