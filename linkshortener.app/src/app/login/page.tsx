'use client';

import { ActionIcon, Button, Center, Container, Group, PasswordInput, TextInput, Title } from "@mantine/core";
import { AtIcon, LockIcon } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div>
            <main>
                <Container>
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
                    <Button>Login</Button>
                </Container>
            </main>
        </div>
    );
}
