'use client';

import Image from "next/image";
import styles from "./page.module.css";
import { ActionIcon, Button, Center, Container, Group, Title } from "@mantine/core";
import { GithubLogoIcon } from '@phosphor-icons/react';

export default function Home() {
  return (
    <div>
      <main>
        <Center style={{ height: "100vh" }}>
          <Container ta="center">
            <Group>
              <Button color="dark" onClick={() => window.location.href = '/login'}>
                Login
              </Button>
              <Button color="dark" onClick={() => window.location.href = '/register'}>
                Register
              </Button>
            </Group>
          </Container>
        </Center>
      </main>
    </div>
  );
}
