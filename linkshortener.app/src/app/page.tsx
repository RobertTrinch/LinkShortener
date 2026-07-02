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
              <Button color="dark">Login</Button>
              <Button color="dark">
                Register
              </Button>
              <ActionIcon variant="filled" color='dark' size='lg' aria-label="Github">
                <GithubLogoIcon size={20}/>
              </ActionIcon>
            </Group>
          </Container>
        </Center>
      </main>
    </div>
  );
}
