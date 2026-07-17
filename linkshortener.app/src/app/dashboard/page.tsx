'use client';

import { useAuth } from "@/context/authContext";
import { doPost } from "@/helpers/apiClient";
import { ActionIcon, Button, Center, Container, Grid, GridCol, Group, Paper, PasswordInput, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { AtIcon, FolderIcon, LinkIcon, LockIcon } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreateShortLinkResponse {
    success: boolean;
    message: string;
}

export default function Home() {
    const router = useRouter();
    const auth = useAuth();

    const [url, setUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [folderName, setFolderName] = useState('');


    if (!auth.isAuthenticated) {
        router.push('/login');
        return null;
    }

    const handleLinkCreation = async () => {
        try {
            const success = await doPost<CreateShortLinkResponse>('/api/ShortLink/CreateShortLink', {
                body: { slug, url, folderName },
            });
            if (success.data?.success === true) {
                notifications.show({
                    title: 'Link created!',
                    message: 'Link created successfully.',
                });
                navigator.clipboard.writeText(success.data?.message || '');
            } else {
                notifications.show({
                    title: 'Error occurred.',
                    message: success.data?.message || 'Failed to create link.',
                });
            }
        } catch (error) {
            console.error('An error occurred during link creation:', error);
        }
    };

    return (
        <div>
            <main>
                <Container my="md">
                    <Grid gap="md">
                        <GridCol span={{ base: 12, md: 6, lg: 6 }}>
                            <Paper p="lg">
                                <Title order={2}>Welcome, {auth.user?.displayName}!</Title>
                                <Button onClick={() => auth.logout()} mt="md" fullWidth>
                                    Log out
                                </Button>
                            </Paper>
                        </GridCol>
                        <GridCol span={{ base: 12, md: 6, lg: 6 }}>
                            <Paper p="lg" withBorder>
                                <TextInput
                                    leftSectionPointerEvents="none"
                                    leftSection={<LinkIcon size={16} />}
                                    placeholder="Enter the full URL"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                                <TextInput
                                    leftSectionPointerEvents="none"
                                    leftSection={<AtIcon size={16} />}
                                    placeholder="Slug (optional)"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                                <TextInput
                                    leftSectionPointerEvents="none"
                                    leftSection={<FolderIcon size={16} />}
                                    placeholder="Folder Name (optional)"
                                    value={folderName}
                                    onChange={(e) => setFolderName(e.target.value)}
                                />

                                <Button onClick={handleLinkCreation} mt="md" fullWidth>
                                    Create
                                </Button>
                            </Paper>
                        </GridCol>
                    </Grid>
                </Container>
            </main>
        </div>
    );
}
