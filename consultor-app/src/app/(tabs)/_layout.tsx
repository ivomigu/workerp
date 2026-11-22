import { NativeTabs } from 'expo-router/native-tabs';

import { useMisCitas } from '@/hooks/use-citas';

export default function TabsLayout() {
  const proximas = (useMisCitas().data ?? []).filter(
    (c) => c.estado === 'confirmada' && new Date(c.inicio).getTime() > Date.now(),
  ).length;

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(agendar)">
        <NativeTabs.Trigger.Icon sf="calendar.badge.plus" md="calendar_add_on" />
        <NativeTabs.Trigger.Label>Agendar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(citas)">
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="event_note" />
        <NativeTabs.Trigger.Label>Mis citas</NativeTabs.Trigger.Label>
        {proximas > 0 && <NativeTabs.Trigger.Badge>{String(proximas)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
