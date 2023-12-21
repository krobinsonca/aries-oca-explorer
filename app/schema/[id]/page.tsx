'use client';

import OverlayBundleView from "@/app/components/OverlayBundleView";
import { fetchOverlayBundleData, fetchOverlayBundleList } from "@/app/lib/data";
import { CredentialExchangeRecord, CredentialPreviewAttribute, CredentialState } from "@aries-framework/core";
import { OverlayBundle } from "@hyperledger/aries-oca";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const [overlayData, setOverlayData] = useState<{
    overlay: OverlayBundle | undefined;
    record: CredentialExchangeRecord | undefined;
  }>({ overlay: undefined, record: undefined });

  const { push } = useRouter();
  useEffect(() => {
    async function fetchData() {
      const options: any[] = await fetchOverlayBundleList();
      const option = options.find((option) => option.id === id);

      if (!option) {
        push(`/schema`);
        return;
      }

      const { overlay, data } = await fetchOverlayBundleData(option);

      const record = new CredentialExchangeRecord({
        threadId: "123",
        protocolVersion: "1.0",
        state: CredentialState.OfferReceived,
        credentialAttributes: Object.entries(data).map(
          ([name, value]) => new CredentialPreviewAttribute({ name, value })
        ),
      });
      setOverlayData({ overlay, record });
    }

    fetchData();
  }, [id, push]);

  return overlayData && overlayData.overlay && overlayData.record && (
    <OverlayBundleView overlay={overlayData.overlay} record={overlayData.record} />
  );
}