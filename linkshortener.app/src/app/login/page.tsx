'use client';

import { useAuth } from "@/context/authContext";
import { doPost } from "@/helpers/apiClient";
import { ActionIcon, Button, Center, Container, Group, PasswordInput, TextInput, Title } from "@mantine/core";
import { AtIcon, LockIcon } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
    const router = useRouter();
    const auth = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    if(auth.isAuthenticated) {
        router.push('/dashboard');
        return null;
    }

    const handleLogin = async () => {
        try {
            const success = await auth.login(email, password);
            if (success) {
                router.push('/dashboard');
            } else {
                // Handle login failure (e.g., show an error message)
                console.error('Login failed');
            }
        }
        catch (error) {
            console.error('An error occurred during login:', error);
        }
    };

    return (
        <div>
            <main>
                <Container my="md" px="md">
                    <Center>
                        <Group ta="center" mb="md">
                            <Title order={2} pr="lg">Login</Title>
                            <Title order={2} c="dimmed" pl="lg" onClick={() => router.push('/register')}>
                                Register
                            </Title>
                        </Group>
                    </Center>
                    <TextInput
                        leftSectionPointerEvents="none"
                        leftSection={<AtIcon size={16} />}
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        mb="sm"
                    />
                    <PasswordInput
                        leftSection={<LockIcon size={18} />}
                        leftSectionPointerEvents="none"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        mb="sm"
                    />
                    <Button onClick={handleLogin}>Login</Button>
                </Container>
            </main>
        </div>
    );
}
