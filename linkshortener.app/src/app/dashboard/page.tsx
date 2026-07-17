'use client';

import { useAuth } from "@/context/authContext";
import { doPost } from "@/helpers/apiClient";
import { ActionIcon, Button, Center, Container, Group, PasswordInput, TextInput, Title } from "@mantine/core";
import { AtIcon, FolderIcon, LinkIcon, LockIcon } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
    const router = useRouter();
    const auth = useAuth();

    const [url, setUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [folderName, setFolderName] = useState('');
    

    if(!auth.isAuthenticated) {
        router.push('/login');
        return null;
    }

    const handleLogin = async () => {
        try {
            const success = await doPost('/api/ShortLink/CreateShortLink', { body: { slug: slug, url: url, folderName: folderName } });
            if (success) {

            } else {

            }
        }
        catch (error) {
            console.error('An error occurred during login:', error);
        }
    };

    return (
        <div>
            <main>
                <Container>
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

                    <Button onClick={handleLogin}>Create Short Link</Button>
                </Container>
            </main>
        </div>
    );
}
