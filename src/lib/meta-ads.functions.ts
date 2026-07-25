import { createServerFn } from "@tanstack/react-start";

export type AdsInsight = {
  campaign: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  reach: number;
  leads: number;
};

export type AdsSummary = {
  configured: boolean;
  error?: string;
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number;
    cpc: number;
    cpl: number;
  };
  campaigns: AdsInsight[];
  currency: string;
  since: string;
  until: string;
};

function mockSummary(reason?: string): AdsSummary {
  const campaigns: AdsInsight[] = [
    { campaign: "Leads Apartamentos Zona Sul", status: "ACTIVE", spend: 1240.55, impressions: 68430, clicks: 1412, ctr: 2.06, cpc: 0.88, reach: 41200, leads: 87 },
    { campaign: "Retargeting Site", status: "ACTIVE", spend: 480.10, impressions: 22140, clicks: 615, ctr: 2.78, cpc: 0.78, reach: 15800, leads: 42 },
    { campaign: "Lançamento Cobertura", status: "PAUSED", spend: 322.00, impressions: 11020, clicks: 189, ctr: 1.71, cpc: 1.70, reach: 8320, leads: 11 },
  ];
  const totals = campaigns.reduce(
    (a, c) => ({
      spend: a.spend + c.spend,
      impressions: a.impressions + c.impressions,
      clicks: a.clicks + c.clicks,
      leads: a.leads + c.leads,
      ctr: 0, cpc: 0, cpl: 0,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, ctr: 0, cpc: 0, cpl: 0 },
  );
  totals.ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
  totals.cpc = totals.clicks ? totals.spend / totals.clicks : 0;
  totals.cpl = totals.leads ? totals.spend / totals.leads : 0;
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 86400_000);
  return {
    configured: false,
    error: reason,
    totals,
    campaigns,
    currency: "BRL",
    since: since.toISOString().slice(0, 10),
    until: now.toISOString().slice(0, 10),
  };
}

export const getMetaAdsSummary = createServerFn({ method: "GET" }).handler(async (): Promise<AdsSummary> => {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_ACCOUNT_ID;
  if (!token || !accountId) return mockSummary("Meta Ads não configurado — exibindo dados simulados.");

  try {
    const fields = [
      "campaign_name",
      "spend",
      "impressions",
      "clicks",
      "ctr",
      "cpc",
      "reach",
      "actions",
    ].join(",");
    const url = `https://graph.facebook.com/v21.0/act_${accountId}/insights?level=campaign&date_preset=last_30d&fields=${fields}&access_token=${token}`;
    const res = await fetch(url);
    const json = (await res.json()) as any;
    if (!res.ok) return mockSummary(json?.error?.message ?? `HTTP ${res.status}`);

    const campaigns: AdsInsight[] = (json.data ?? []).map((c: any) => {
      const leads = Number(
        (c.actions ?? []).find((a: any) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped")?.value ?? 0,
      );
      return {
        campaign: c.campaign_name,
        status: c.status ?? "ACTIVE",
        spend: Number(c.spend ?? 0),
        impressions: Number(c.impressions ?? 0),
        clicks: Number(c.clicks ?? 0),
        ctr: Number(c.ctr ?? 0),
        cpc: Number(c.cpc ?? 0),
        reach: Number(c.reach ?? 0),
        leads,
      };
    });
    const totals = campaigns.reduce(
      (a, c) => ({
        spend: a.spend + c.spend,
        impressions: a.impressions + c.impressions,
        clicks: a.clicks + c.clicks,
        leads: a.leads + c.leads,
        ctr: 0, cpc: 0, cpl: 0,
      }),
      { spend: 0, impressions: 0, clicks: 0, leads: 0, ctr: 0, cpc: 0, cpl: 0 },
    );
    totals.ctr = totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0;
    totals.cpc = totals.clicks ? totals.spend / totals.clicks : 0;
    totals.cpl = totals.leads ? totals.spend / totals.leads : 0;
    const now = new Date();
    const since = new Date(now.getTime() - 30 * 86400_000);
    return {
      configured: true,
      totals, campaigns,
      currency: "BRL",
      since: since.toISOString().slice(0, 10),
      until: now.toISOString().slice(0, 10),
    };
  } catch (e: any) {
    return mockSummary(e?.message ?? "Erro ao buscar Meta Ads");
  }
});
