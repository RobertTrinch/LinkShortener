'use client';

import { useAuth } from "@/context/authContext";
import { doPost } from "@/helpers/apiClient";
import { ActionIcon, Button, Center, Container, Group, PasswordInput, PinInput, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { AtIcon, LockIcon, UserIcon } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
    const router = useRouter();
    const auth = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [pin, setPin] = useState('');

    if (auth.isAuthenticated) {
        router.push('/dashboard');
        return null;
    }

    const handleRegister = async () => {
        await doPost('/api/auth/RegisterUser', { body: { email, password, displayName, registerCode: pin } }).then((response) => {
            const data = response.data as { success?: boolean; message?: string };

            if (data.success) {
                notifications.show({
                    title: 'Registration Successful',
                    message: 'You have successfully registered. Please log in.',
                    color: 'green',
                });
                router.push('/login');
            }
            else {
                // Handle registration failure (e.g., show an error message)
                notifications.show({
                    title: 'Registration Failed',
                    message: 'An error occurred while registering. ' + (data.message ?? ''),
                    color: 'red',
                });
                console.error('Registration failed');
            };
        })
        
    };

    return (
        <div>
            <main>
                <Container my="md" px="md">
                    <Center>
                        <Group ta="center" mb="md">
                            <Title order={2} c="dimmed" pr="lg" onClick={() => router.push('/login')}>
                                Login
                            </Title>
                            <Title order={2} pl="lg">Register</Title>
                        </Group>
                    </Center>
                    <TextInput
                        leftSectionPointerEvents="none"
                        leftSection={<UserIcon size={16} />}
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        mb="sm"
                    />
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
                    <Group>
                        <Text size="md" mb="sm">Register Code:</Text>
                        <PinInput length={6} type="number" value={pin} onChange={setPin} mb="sm" placeholder="-" />
                    </Group>
                    <Button onClick={handleRegister}>Register</Button>
                </Container>
            </main>
        </div>
    );
}
