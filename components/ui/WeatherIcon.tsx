"use client";

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
} from "@phosphor-icons/react";
import type { WeatherIconKind } from "@/lib/openmeteo";

interface WeatherIconProps {
  kind: WeatherIconKind;
  isDay?: boolean;
  size?: number;
  className?: string;
}

/** WMO icon group -> Phosphor glyph (light weight, one family, no emoji). */
export default function WeatherIcon({
  kind,
  isDay = true,
  size = 20,
  className,
}: WeatherIconProps) {
  const common = { size, weight: "light" as const, className, "aria-hidden": true };
  switch (kind) {
    case "clear":
      return isDay ? <Sun {...common} /> : <Moon {...common} />;
    case "partly":
      return isDay ? <CloudSun {...common} /> : <CloudMoon {...common} />;
    case "overcast":
      return <Cloud {...common} />;
    case "fog":
      return <CloudFog {...common} />;
    case "drizzle":
    case "rain":
    case "showers":
      return <CloudRain {...common} />;
    case "freezing":
      return <Snowflake {...common} />;
    case "snow":
      return <CloudSnow {...common} />;
    case "thunder":
      return <CloudLightning {...common} />;
  }
}
