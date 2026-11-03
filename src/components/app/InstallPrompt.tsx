"use client";

import { useState } from "react";
import { InstallBanner, IosInstallSheet } from "@/components/ui/InstallBanner";
import { dismissInstall, installApp, useInstallMode } from "@/lib/install-prompt";

/** 설치할 수 있는 환경에서만 보인다. 미지원 브라우저와 이미 설치한 앱에서는 아무것도 그리지 않는다. */
export function InstallPrompt() {
  const mode = useInstallMode();
  const [guide, setGuide] = useState(false);
  if (mode === "hidden") return null;
  return (
    <div className="px-(--spacing-20) pb-(--spacing-8)">
      {mode === "android" ? (
        <InstallBanner description="홈 화면에 추가하고 바로 열어 보세요" actionLabel="설치" onAction={() => void installApp()} onDismiss={dismissInstall} />
      ) : (
        <>
          <InstallBanner description="홈 화면에 추가하고 바로 열어 보세요" actionLabel="방법 보기" onAction={() => setGuide(true)} onDismiss={dismissInstall} />
          <IosInstallSheet open={guide} onClose={() => setGuide(false)} />
        </>
      )}
    </div>
  );
}
