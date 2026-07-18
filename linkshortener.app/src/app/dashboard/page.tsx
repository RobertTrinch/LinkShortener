'use client';

import { useAuth } from "@/context/authContext";
import { doDelete, doGet, doPost, doPut } from "@/helpers/apiClient";
import { Badge, Button, Center, Container, Grid, GridCol, Group, Loader, Modal, Paper, Table, Text, TextInput, Title, SimpleGrid } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { AtIcon, FolderIcon, LinkIcon } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    AreaChart,
    Area,
} from 'recharts';

interface CreateShortLinkResponse {
    success: boolean;
    message: string;
}

export interface User {
    userId: number;
    displayName: string;
}

export interface Folder {
    folderId: number;
    folderName: string;
}

export interface Analytics {
    clickedAt: string;
    referrer: string;
    ipCountry: string;
}

export interface Last30ClickDto {
    shortLinkId: number;
    shortLinkSlug: string;
    folderId?: number | null;
    folderName?: string | null;
    clickedAt: string;
    referrer?: string | null;
    ipCountry?: string | null;
}

export interface ShortLinkInfoResponse {
    shortLinkId: number;
    createdAt: string;
    slug: string;
    url: string;
    user: User;
    folder?: Folder | null;
    analytics?: Analytics[] | null;
}

const CHART_COLORS = ['#4c6ef5', '#15aabf', '#fcc419', '#fa5252', '#7950f2', '#37b24d'];

export interface ShortLinkDto {
    shortLinkId: number;
    createdAt: string;
    slug: string;
    url: string;
    user: User;
    folder?: Folder | null;
    analytics?: Analytics[] | null;
}


export default function Home() {
    const router = useRouter();
    const auth = useAuth();

    const [url, setUrl] = useState('');
    const [slug, setSlug] = useState('');
    const [folderName, setFolderName] = useState('');

    const [hasLoaded, setHasLoaded] = useState(false);
    const [shortLinks, setShortLinks] = useState<ShortLinkDto[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'createdAt' | 'slug' | 'url' | 'folder'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedLink, setSelectedLink] = useState<ShortLinkDto | null>(null);
    const [selectedLinkAnalytics, setSelectedLinkAnalytics] = useState<Analytics[]>([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsError, setAnalyticsError] = useState<string | null>(null);
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [draftSlug, setDraftSlug] = useState('');
    const [draftUrl, setDraftUrl] = useState('');
    const [draftFolderName, setDraftFolderName] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [last30Data, setLast30Data] = useState<Last30ClickDto[]>([]);
    const [last30Loading, setLast30Loading] = useState(false);
    const [last30Error, setLast30Error] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.isAuthenticated) {
            router.push('/login');
        }
    }, [auth.isAuthenticated, router]);

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
                doGet<ShortLinkDto[]>('/api/ShortLink/GetAllShortLinks').then((response) => {
                    if (response.data) {
                        setShortLinks(response.data);
                        setHasLoaded(true);
                    } else {
                        console.error('Failed to fetch short links:', response);
                    }
                });
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

    useEffect(() => {
        if (hasLoaded) {
            return;
        }

        doGet<ShortLinkDto[]>('/api/ShortLink/GetAllShortLinks').then((response) => {
            if (response.data) {
                setShortLinks(response.data);
                setHasLoaded(true);
            } else {
                console.error('Failed to fetch short links:', response);
            }
        });
    }, [hasLoaded]);

    useEffect(() => {
        let mounted = true;
        setLast30Loading(true);
        doGet<Last30ClickDto[]>('/api/ShortLink/GetLast30Days')
            .then((res) => {
                if (!mounted) return;
                if (res.ok && res.data) {
                    setLast30Data(res.data);
                } else {
                    setLast30Error(res.statusMessage || 'Failed to load last 30 days data.');
                }
            })
            .catch((err) => {
                console.error('Failed to fetch last30:', err);
                if (!mounted) return;
                setLast30Error('Failed to load last 30 days data.');
            })
            .finally(() => {
                if (!mounted) return;
                setLast30Loading(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const handleSort = (column: 'createdAt' | 'slug' | 'url' | 'folder') => {
        if (sortBy === column) {
            setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortBy(column);
        setSortDirection('asc');
    };

    const filteredAndSortedLinks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        const filtered = shortLinks.filter((link) => {
            const searchableText = [
                link.slug,
                link.url,
                link.folder?.folderName,
                link.user.displayName,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(query);
        });

        return [...filtered].sort((a, b) => {
            const direction = sortDirection === 'asc' ? 1 : -1;

            if (sortBy === 'slug') {
                return a.slug.localeCompare(b.slug) * direction;
            }

            if (sortBy === 'url') {
                return a.url.localeCompare(b.url) * direction;
            }

            if (sortBy === 'folder') {
                const fa = a.folder?.folderName ?? '';
                const fb = b.folder?.folderName ?? '';
                return fa.localeCompare(fb) * direction;
            }

            return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
        });
    }, [searchQuery, shortLinks, sortBy, sortDirection]);

    useEffect(() => {
        if (!selectedLink) {
            setIsEditingLink(false);
            setDraftSlug('');
            setDraftUrl('');
            setDraftFolderName('');
            return;
        }

        setDraftSlug(selectedLink.slug ?? '');
        setDraftUrl(selectedLink.url ?? '');
        setDraftFolderName(selectedLink.folder?.folderName ?? '');
        setIsEditingLink(false);
    }, [selectedLink]);

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedLink(null);
        setSelectedLinkAnalytics([]);
        setAnalyticsError(null);
        setIsEditingLink(false);
        setDraftSlug('');
        setDraftUrl('');
        setDraftFolderName('');
        setDeleteConfirmOpen(false);
    };

    const handleStartEdit = () => {
        setIsEditingLink(true);
    };

    const handleDiscardEdit = () => {
        setDraftSlug(selectedLink?.slug ?? '');
        setDraftUrl(selectedLink?.url ?? '');
        setDraftFolderName(selectedLink?.folder?.folderName ?? '');
        setIsEditingLink(false);
    };

    const handleSaveLink = async () => {
        if (!selectedLink) {
            return;
        }

        const payload = {
            slug: draftSlug.trim(),
            url: draftUrl.trim(),
            folderName: draftFolderName.trim(),
        };

        setActionLoading(true);

        try {
            const response = await doPut<CreateShortLinkResponse>(`/api/ShortLink/EditShortLink?shortLinkId=${selectedLink.shortLinkId}`, {
                body: payload,
            });

            if (response.data?.success === true) {
                const updatedLink: ShortLinkDto = {
                    ...selectedLink,
                    slug: payload.slug,
                    url: payload.url,
                    folder: payload.folderName
                        ? { folderId: selectedLink.folder?.folderId ?? 0, folderName: payload.folderName }
                        : null,
                };

                setSelectedLink(updatedLink);
                setShortLinks((current) => current.map((link) => link.shortLinkId === selectedLink.shortLinkId ? updatedLink : link));
                setIsEditingLink(false);
                notifications.show({
                    title: 'Link updated',
                    message: response.data.message || 'The short link details were saved successfully.',
                });
            } else {
                notifications.show({
                    title: 'Update failed',
                    message: response.data?.message || response.statusMessage || 'Could not update the short link.',
                });
            }
        } catch (error) {
            console.error('Failed to update short link:', error);
            notifications.show({
                title: 'Update failed',
                message: 'An unexpected error occurred while updating the short link.',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteLink = async () => {
        if (!selectedLink) {
            return;
        }

        setActionLoading(true);

        try {
            const response = await doDelete(`/api/ShortLink/DeleteShortLink?shortLinkId=${selectedLink.shortLinkId}`);

            if (response.ok) {
                setShortLinks((current) => current.filter((link) => link.shortLinkId !== selectedLink.shortLinkId));
                notifications.show({
                    title: 'Link deleted',
                    message: 'The short link was removed successfully.',
                });
                setDeleteConfirmOpen(false);
                handleCloseDetails();
            } else {
                notifications.show({
                    title: 'Delete failed',
                    message: response.statusMessage || 'Could not delete the short link.',
                });
            }
        } catch (error) {
            console.error('Failed to delete short link:', error);
            notifications.show({
                title: 'Delete failed',
                message: 'An unexpected error occurred while deleting the short link.',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRowClick = async (link: ShortLinkDto) => {
        setSelectedLink(link);
        setDetailsOpen(true);
        setAnalyticsLoading(true);
        setAnalyticsError(null);

        try {
            const response = await doGet<ShortLinkInfoResponse>('/api/ShortLink/GetShortLinkInfo?shortLinkId=' + link.shortLinkId);

            if (response.ok && response.data) {
                setSelectedLinkAnalytics(response.data.analytics ?? link.analytics ?? []);
            } else {
                setSelectedLinkAnalytics(link.analytics ?? []);
                setAnalyticsError(response.statusMessage || 'Unable to load analytics details.');
            }
        } catch (error) {
            console.error('Failed to fetch short link info:', error);
            setSelectedLinkAnalytics(link.analytics ?? []);
            setAnalyticsError('Failed to load analytics details.');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleOpenById = async (shortLinkId: number) => {
        setSelectedLink(null);
        setSelectedLinkAnalytics([]);
        setAnalyticsLoading(true);
        setAnalyticsError(null);
        setDetailsOpen(true);

        try {
            const response = await doGet<ShortLinkInfoResponse>('/api/ShortLink/GetShortLinkInfo?shortLinkId=' + shortLinkId);

            if (response.ok && response.data) {
                const info = response.data;
                const mapped: ShortLinkDto = {
                    shortLinkId: info.shortLinkId,
                    createdAt: info.createdAt,
                    slug: info.slug,
                    url: info.url,
                    user: info.user,
                    folder: info.folder ?? null,
                    analytics: info.analytics ?? [],
                };

                setSelectedLink(mapped);
                setSelectedLinkAnalytics(info.analytics ?? []);
            } else {
                setAnalyticsError(response.statusMessage || 'Unable to load analytics details.');
            }
        } catch (err) {
            console.error('Failed to fetch short link info by id:', err);
            setAnalyticsError('Failed to load analytics details.');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const referrerData = useMemo(() => {
        const counts: Record<string, number> = {};

        selectedLinkAnalytics.forEach((record) => {
            const referrer = record.referrer?.trim() || 'Direct / Unknown';
            counts[referrer] = (counts[referrer] ?? 0) + 1;
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [selectedLinkAnalytics]);

    const dailyVisitsData = useMemo(() => {
        const counts: Record<string, number> = {};

        selectedLinkAnalytics.forEach((record) => {
            if (!record.clickedAt) {
                return;
            }

            const dateKey = new Date(record.clickedAt).toISOString().split('T')[0];
            counts[dateKey] = (counts[dateKey] ?? 0) + 1;
        });

        return Object.entries(counts)
            .map(([date, count]) => ({
                date,
                display: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                count,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedLinkAnalytics]);

    const last30Stats = useMemo(() => {
        const totalClicks = last30Data.length;

        const todayKey = new Date().toISOString().split('T')[0];
        const clicksToday = last30Data.filter((r) => new Date(r.clickedAt).toISOString().split('T')[0] === todayKey).length;

        const byLink: Record<string, { shortLinkId: number; slug: string; folder?: string | null; count: number }> = {};
        last30Data.forEach((r) => {
            const slug = r.shortLinkSlug || 'unknown';
            const folder = r.folderName ?? null;
            const key = `${folder ?? ''}/${slug}`;
            if (!byLink[key]) {
                byLink[key] = { shortLinkId: r.shortLinkId, slug, folder, count: 0 };
            }
            // keep the most recent id seen (same slug/folder expected to share id)
            byLink[key].shortLinkId = r.shortLinkId;
            byLink[key].count += 1;
        });

        const top3 = Object.values(byLink)
            .map((v) => ({ shortLinkId: v.shortLinkId, slug: v.slug, folder: v.folder, count: v.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        const byReferrer: Record<string, number> = {};
        last30Data.forEach((r) => {
            const ref = r.referrer?.trim() || 'Direct / Unknown';
            byReferrer[ref] = (byReferrer[ref] ?? 0) + 1;
        });

        const topReferrers = Object.entries(byReferrer)
            .map(([ref, count]) => ({ ref, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        // hourly for last 24 hours
        const now = new Date();
        const hours: { label: string; hourKey: string; count: number }[] = [];
        for (let i = 23; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourKey = d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
            const label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            hours.push({ label, hourKey, count: 0 });
        }

        const counts: Record<string, number> = {};
        last30Data.forEach((r) => {
            const key = new Date(r.clickedAt).toISOString().slice(0, 13);
            counts[key] = (counts[key] ?? 0) + 1;
        });

        const hourly = hours.map((h) => ({ display: h.label, count: counts[h.hourKey] ?? 0 }));

        return { totalClicks, clicksToday, top3, topReferrers, hourly };
    }, [last30Data]);

    if (!auth.isAuthenticated) {
        return null;
    }

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
                                    mb="sm"
                                />
                                <TextInput
                                    leftSectionPointerEvents="none"
                                    leftSection={<AtIcon size={16} />}
                                    placeholder="Slug (optional)"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    mb="sm"
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
                        <GridCol span={{ base: 12, md: 12, lg: 12 }}>
                            <Paper p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Title order={3}>Analytics - Last 30 Days</Title>
                                    <Text c="dimmed" size="sm">Overview of recent clicks</Text>
                                </Group>

                                {last30Loading ? (
                                    <Center py="xl"><Loader /></Center>
                                ) : last30Error ? (
                                    <Text color="red">{last30Error}</Text>
                                ) : (
                                    <>
                                        <Grid>
                                            <GridCol span={{ base: 12, md: 6, lg: 3 }}>
                                                <Paper p="md" withBorder mb="sm">
                                                    <Text size="sm" c="dimmed">Clicks (30 days)</Text>
                                                    <Text size="lg" style={{ fontWeight: 700 }}>{last30Stats.totalClicks}</Text>
                                                </Paper>
                                            </GridCol>
                                            <GridCol span={{ base: 12, md: 6, lg: 3 }}>
                                                <Paper p="md" withBorder mb="sm">
                                                    <Text size="sm" c="dimmed">Clicks Today</Text>
                                                    <Text size="lg" style={{ fontWeight: 700 }}>{last30Stats.clicksToday}</Text>
                                                </Paper>
                                            </GridCol>
                                            <GridCol span={{ base: 12, md: 6, lg: 3 }}>
                                                <Paper p="md" withBorder mb="sm">
                                                    <Text size="sm" c="dimmed">Top 3 (folder/slug)</Text>
                                                    {last30Stats.top3.length > 0 ? (
                                                        last30Stats.top3.map((t) => (
                                                            <Button key={`${t.shortLinkId}-${t.slug}`} variant="subtle" size="xs" onClick={() => handleOpenById(t.shortLinkId)}>
                                                                {`${t.folder ? t.folder + '/' : ''}${t.slug}`} - {t.count}
                                                            </Button>
                                                        ))
                                                    ) : (
                                                        <Text c="dimmed">No clicks yet</Text>
                                                    )}
                                                </Paper>
                                            </GridCol>
                                            <GridCol span={{ base: 12, md: 6, lg: 3 }}>
                                                <Paper p="md" withBorder mb="sm">
                                                    <Text size="sm" c="dimmed">Top 3 Referrers</Text>
                                                    {last30Stats.topReferrers && last30Stats.topReferrers.length > 0 ? (
                                                        last30Stats.topReferrers.map((r) => (
                                                            <Text key={r.ref}>{r.ref} — {r.count}</Text>
                                                        ))
                                                    ) : (
                                                        <Text c="dimmed">No referrer data</Text>
                                                    )}
                                                </Paper>
                                            </GridCol>
                                        </Grid>

                                        <Paper p="md" withBorder>
                                            <Text w={600} mb="sm">Hourly (last 24h)</Text>
                                            <div style={{ width: '100%', height: 240 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={last30Stats.hourly}>
                                                        <defs>
                                                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#1971c2" stopOpacity={0.38} />
                                                                <stop offset="100%" stopColor="#1971c2" stopOpacity={0.03} />
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis dataKey="display" tick={false} axisLine={false} />
                                                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                                        <Tooltip
                                                            formatter={(value: any) => [`${value}`, 'Clicks']}
                                                            labelFormatter={(label: any) => `${label}`}
                                                            cursor={{ stroke: '#1971c2', strokeWidth: 1, opacity: 0.12 }}
                                                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(16,24,40,0.08)' }}
                                                        />
                                                        <Area type="monotone" dataKey="count" name="Clicks" stroke="#1971c2" strokeWidth={2} fill="url(#areaGrad)" activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Paper>
                                    </>
                                )}
                            </Paper>
                        </GridCol>
                        <GridCol span={{ base: 12, md: 12, lg: 12 }}>
                            <Paper p="lg" withBorder>
                                <Group justify="space-between" mb="md">
                                    <Title order={3}>Short Links</Title>
                                    <Text c="dimmed" size="sm">
                                        {filteredAndSortedLinks.length} {filteredAndSortedLinks.length === 1 ? 'link' : 'links'}
                                    </Text>
                                </Group>

                                <TextInput
                                    placeholder="Search by slug, URL, folder, or owner"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.currentTarget.value)}
                                    mb="md"
                                />

                                {shortLinks.length > 0 ? (
                                    filteredAndSortedLinks.length > 0 ? (
                                        <Table striped highlightOnHover withTableBorder>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>
                                                        <Button variant="subtle" size="compact-xs" onClick={() => handleSort('slug')}>
                                                            Slug {sortBy === 'slug' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                        </Button>
                                                    </Table.Th>
                                                    <Table.Th>
                                                        <Button variant="subtle" size="compact-xs" onClick={() => handleSort('url')}>
                                                            URL {sortBy === 'url' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                        </Button>
                                                    </Table.Th>
                                                    <Table.Th>
                                                        <Button variant="subtle" size="compact-xs" onClick={() => handleSort('folder')}>
                                                            Folder {sortBy === 'folder' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                        </Button>
                                                    </Table.Th>
                                                    <Table.Th>
                                                        <Button variant="subtle" size="compact-xs" onClick={() => handleSort('createdAt')}>
                                                            Created {sortBy === 'createdAt' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                        </Button>
                                                    </Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {filteredAndSortedLinks.map((link) => (
                                                    <Table.Tr
                                                        key={link.shortLinkId}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleRowClick(link)}
                                                    >
                                                        <Table.Td>{link.slug}</Table.Td>
                                                        <Table.Td>
                                                            <Text size="sm" style={{ wordBreak: 'break-word' }}>{link.url}</Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            {link.folder ? <Badge>{link.folder.folderName}</Badge> : <Text c="dimmed">None</Text>}
                                                        </Table.Td>
                                                        <Table.Td>{new Date(link.createdAt).toLocaleString()}</Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    ) : (
                                        <Text c="dimmed">No links match your search.</Text>
                                    )
                                ) : (
                                    <Text c="dimmed">No short links available.</Text>
                                )}
                            </Paper>
                        </GridCol>
                    </Grid>

                    <Modal opened={detailsOpen} onClose={handleCloseDetails} title={selectedLink ? `Analytics for ${selectedLink.slug}` : 'Link analytics'} size="80%">
                        {analyticsLoading ? (
                            <Center py="xl">
                                <Loader />
                            </Center>
                        ) : analyticsError ? (
                            <Text color="red" mb="md">{analyticsError}</Text>
                        ) : selectedLink ? (
                            <>
                                <Group justify="space-between" mb="md">
                                    <div>
                                        <Text size="sm" c="dimmed">Edit the short link details below</Text>
                                    </div>
                                    <Group>
                                        {isEditingLink ? (
                                            <>
                                                <Button onClick={handleSaveLink} loading={actionLoading}>Save</Button>
                                                <Button variant="default" onClick={handleDiscardEdit} disabled={actionLoading}>Undo / Discard</Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button onClick={handleStartEdit}>Edit</Button>
                                                <Button color="red" variant="light" onClick={() => setDeleteConfirmOpen(true)}>Delete</Button>
                                            </>
                                        )}
                                    </Group>
                                </Group>

                                <Paper p="md" withBorder mb="md">
                                    <TextInput
                                        label="Slug"
                                        value={draftSlug}
                                        onChange={(event) => setDraftSlug(event.currentTarget.value)}
                                        disabled={!isEditingLink}
                                        mb="sm"
                                    />
                                    <TextInput
                                        label="URL"
                                        value={draftUrl}
                                        onChange={(event) => setDraftUrl(event.currentTarget.value)}
                                        disabled={!isEditingLink}
                                        mb="sm"
                                    />
                                    <TextInput
                                        label="Folder"
                                        value={draftFolderName}
                                        onChange={(event) => setDraftFolderName(event.currentTarget.value)}
                                        disabled={!isEditingLink}
                                    />
                                </Paper>

                                <Group align="flex-start" mb="md">
                                    <div>
                                        <Text size="sm" c="dimmed">Created</Text>
                                        <Text>{new Date(selectedLink.createdAt).toLocaleString()}</Text>
                                    </div>
                                    <div>
                                        <Text size="sm" c="dimmed">Total clicks</Text>
                                        <Text>{selectedLinkAnalytics.length}</Text>
                                    </div>
                                    <div>
                                        <Text size="sm" c="dimmed">Owner</Text>
                                        <Text>{selectedLink.user.displayName}</Text>
                                    </div>
                                </Group>

                                <Grid>
                                    <GridCol span={12} m={6}>
                                        <Paper p="md" withBorder mb="md">
                                            <Text w={600} mb="sm">Referrer breakdown</Text>
                                            {referrerData.length > 0 ? (
                                                <div style={{ width: '100%', height: 300 }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={referrerData}
                                                                dataKey="value"
                                                                nameKey="name"
                                                                cx="50%"
                                                                cy="50%"
                                                                outerRadius={100}
                                                                label
                                                            >
                                                                {referrerData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                            <Legend verticalAlign="bottom" height={36} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <Text c="dimmed">No referrer data available yet.</Text>
                                            )}
                                        </Paper>
                                    </GridCol>
                                    <GridCol span={12} m={6}>
                                        <Paper p="md" withBorder mb="md">
                                            <Text w={600} mb="sm">Daily visits</Text>
                                            {dailyVisitsData.length > 0 ? (
                                                <div style={{ width: '100%', height: 300 }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={dailyVisitsData}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="display" />
                                                            <YAxis allowDecimals={false} />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Line type="monotone" dataKey="count" name="Visits" stroke="#4c6ef5" strokeWidth={3} dot={{ r: 4 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <Text c="dimmed">No visit data available yet.</Text>
                                            )}
                                        </Paper>
                                    </GridCol>
                                </Grid>

                                {selectedLinkAnalytics.length > 0 && (
                                    <Paper p="md" withBorder>
                                        <Text w={600} mb="sm">Recent clicks</Text>
                                        <Table striped withColumnBorders>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Time</Table.Th>
                                                    <Table.Th>Referrer</Table.Th>
                                                    <Table.Th>Country</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {selectedLinkAnalytics.slice(0, 8).map((item, index) => (
                                                    <Table.Tr key={`${item.clickedAt}-${index}`}>
                                                        <Table.Td>{new Date(item.clickedAt).toLocaleString()}</Table.Td>
                                                        <Table.Td>{item.referrer || 'Direct / Unknown'}</Table.Td>
                                                        <Table.Td>{item.ipCountry || 'Unknown'}</Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </Paper>
                                )}
                            </>
                        ) : null}
                    </Modal>

                    <Modal
                        opened={deleteConfirmOpen}
                        onClose={() => setDeleteConfirmOpen(false)}
                        title="Delete short link?"
                        centered
                    >
                        <Text mb="md">This action will permanently remove the short link and its analytics history.</Text>
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setDeleteConfirmOpen(false)} disabled={actionLoading}>Cancel</Button>
                            <Button color="red" onClick={handleDeleteLink} loading={actionLoading}>Delete</Button>
                        </Group>
                    </Modal>

                </Container>
            </main>
        </div>
    );
}
