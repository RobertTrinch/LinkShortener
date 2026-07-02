'use client';

import { useAuth } from "@/context/authContext";
import { doPost } from "@/helpers/apiClient";
import { ActionIcon, Button, Center, Container, Group, PasswordInput, PinInput, TextInput, Title } from "@mantine/core";
import { AtIcon, LockIcon } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
    const router = useRouter();
    const auth = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [pin, setPin] = useState('');

    if(auth.isAuthenticated) {
        router.push('/dashboard');
        return null;
    }

    const handleRegister = async () => {
        await doPost('/api/auth/RegisterUser', { body: { email, password, displayName, registerCode: pin } });
    };

    return (
        <div>
            <main>
                <Container>
                    <TextInput
                        leftSectionPointerEvents="none"
                        leftSection={<AtIcon size={16} />}
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                    <TextInput
                        leftSectionPointerEvents="none"
                        leftSection={<AtIcon size={16} />}
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <PasswordInput
                        leftSection={<LockIcon size={18} />}
                        leftSectionPointerEvents="none"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <PinInput length={6} type="number" value={pin} onChange={setPin} />
                    <Button onClick={handleRegister}>Register</Button>
                </Container>
            </main>
        </div>
    );
}
