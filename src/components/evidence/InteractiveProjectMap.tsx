"use client";

import { useMemo, useState, type ReactNode, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Construction,
  Forklift,
  Truck,
  X,
  Sparkles,
  FileText,
  GitBranch,
  AlertTriangle,
  Play,
} from "lucide-react";
import {
  mapAiPins,
  mapCameras,
  mapEquipment,
  mapLayerLabels,
  mapStatusColor,
  mapTimelineDays,
  mapZones,
  mapZoneStatusLabel,
  resolveZoneForDay,
  type MapCamera,
  type MapEquipment,
  type MapLayer,
  type MapZoneStatus,
} from "@/mock/project-map";
import {
  evidenceDocuments,
  evidenceImages,
  evidenceVideos,
} from "@/mock/evidence-hub";
import { spring } from "@/lib/motion";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Focus =
  | { type: "zone"; id: string }
  | { type: "camera"; id: string }
  | { type: "equipment"; id: string }
  | null;

type ResolvedZone = ReturnType<typeof resolveZoneForDay>;

const layers = Object.keys(mapLayerLabels) as MapLayer[];

/** Gentle isometric: plan (x,y) → screen */
function iso(x: number, y: number, elev = 0) {
  const sx = 50 + (x - y) * 0.42;
  const sy = 18 + (x + y) * 0.28 - elev;
  return { x: sx, y: sy };
}

function buildingFaces(z: ResolvedZone, elev: number) {
  const { x, y, w, h } = z;
  const tl = iso(x, y, elev);
  const tr = iso(x + w, y, elev);
  const br = iso(x + w, y + h, elev);
  const bl = iso(x, y + h, elev);
  const ground = 0;
  const tl0 = iso(x, y, ground);
  const tr0 = iso(x + w, y, ground);
  const br0 = iso(x + w, y + h, ground);
  const bl0 = iso(x, y + h, ground);
  return { tl, tr, br, bl, tl0, tr0, br0, bl0 };
}

function pts(
  ...pairs: { x: number; y: number }[]
): string {
  return pairs.map((p) => `${p.x},${p.y}`).join(" ");
}

export function InteractiveProjectMap({
  onZoneFilter,
}: {
  onZoneFilter?: (zoneId: string | null) => void;
}) {
  const [layer, setLayer] = useState<MapLayer>("progress");
  const [dayId, setDayId] = useState(mapTimelineDays[3].id);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [focus, setFocus] = useState<Focus>(null);

  const day = mapTimelineDays.find((d) => d.id === dayId)!;
  const zones = useMemo(
    () => mapZones.map((z) => resolveZoneForDay(z, day)),
    [day]
  );

  const openZone = (id: string) => {
    setFocus({ type: "zone", id });
    onZoneFilter?.(id);
  };

  const clearFocus = () => {
    setFocus(null);
    onZoneFilter?.(null);
  };

  const hovered = zones.find((z) => z.id === hoverZone);

  return (
    <div className="relative">
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-0.5">
        {layers.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLayer(l)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[11px] cursor-pointer transition-all duration-150",
              layer === l
                ? "bg-primary text-text-inverse shadow-[0_0_20px_var(--glow-primary)]"
                : "border border-etch bg-slab/60 text-text-tertiary hover:border-border-hover hover:text-text-secondary"
            )}
          >
            {mapLayerLabels[l]}
          </button>
        ))}
      </div>

      <div className="rounded-[20px] border border-etch overflow-hidden bg-map-canvas">
        <div className="relative">
          {/* ambient */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 40%, var(--map-canvas-mid) 0%, var(--map-canvas) 70%)",
            }}
          />

          <svg
            viewBox="0 0 100 78"
            className="relative w-full h-auto min-h-[380px] md:min-h-[460px]"
            role="img"
            aria-label="نقشه دوقلوی دیجیتال سایت"
          >
            <defs>
              <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--map-building)" />
                <stop offset="100%" stopColor="var(--map-canvas)" />
              </linearGradient>
              <pattern
                id="fineGrid"
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 4 0 L 0 0 0 4"
                  fill="none"
                  stroke="var(--etch-strong)"
                  strokeOpacity="0.5"
                  strokeWidth="0.15"
                />
              </pattern>
              <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* site plate */}
            <polygon
              points={pts(
                iso(0, 0),
                iso(100, 0),
                iso(100, 100),
                iso(0, 100)
              )}
              fill="url(#groundGrad)"
              stroke="var(--etch-strong)"
              strokeWidth="0.3"
            />
            <polygon
              points={pts(
                iso(0, 0),
                iso(100, 0),
                iso(100, 100),
                iso(0, 100)
              )}
              fill="url(#fineGrid)"
            />

            {/* road */}
            <polyline
              points={pts(
                iso(20, 55),
                iso(50, 52),
                iso(80, 55)
              )}
              fill="none"
              stroke="var(--map-road)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <polyline
              points={pts(iso(35, 20), iso(35, 75))}
              fill="none"
              stroke="var(--etch)"
              strokeWidth="1.2"
            />

            {/* buildings — sorted by depth (x+y) */}
            {[...zones]
              .sort((a, b) => a.x + a.y - (b.x + b.y))
              .map((zone) => (
                <Building
                  key={zone.id}
                  zone={zone}
                  layer={layer}
                  active={focus?.type === "zone" && focus.id === zone.id}
                  onEnter={(e) => {
                    setHoverZone(zone.id);
                    const svg = e.currentTarget.ownerSVGElement;
                    if (!svg) return;
                    const rect = svg.getBoundingClientRect();
                    setHoverPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMove={(e) => {
                    const svg = e.currentTarget.ownerSVGElement;
                    if (!svg) return;
                    const rect = svg.getBoundingClientRect();
                    setHoverPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onLeave={() => setHoverZone(null)}
                  onClick={() => openZone(zone.id)}
                />
              ))}
          </svg>

          {/* HTML overlays: cameras & equipment on iso positions */}
          {mapCameras.map((cam) => {
            const p = iso(cam.x, cam.y, 1.5);
            return (
              <button
                key={cam.id}
                type="button"
                onClick={() => setFocus({ type: "camera", id: cam.id })}
                title={cam.label}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-etch-strong bg-[var(--map-marker-bg)] text-accent backdrop-blur-sm cursor-pointer hover:scale-110 hover:border-accent/70 transition-transform shadow-lg"
                style={{
                  left: `${p.x}%`,
                  top: `${(p.y / 78) * 100}%`,
                }}
              >
                <Camera size={11} strokeWidth={1.7} />
                <span
                  className={cn(
                    "absolute top-0 left-0 h-1.5 w-1.5 rounded-full ring-2 ring-[var(--map-marker-ring)]",
                    cam.status === "online" && "bg-success",
                    cam.status === "degraded" && "bg-warning",
                    cam.status === "offline" && "bg-danger"
                  )}
                />
              </button>
            );
          })}

          {mapEquipment.map((eq) => {
            const p = iso(eq.x, eq.y, 1.2);
            return (
              <button
                key={eq.id}
                type="button"
                onClick={() => setFocus({ type: "equipment", id: eq.id })}
                title={eq.name}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-[8px] border border-etch-strong bg-[var(--map-marker-bg)] text-primary cursor-pointer hover:scale-110 transition-transform shadow-lg"
                style={{
                  left: `${p.x}%`,
                  top: `${(p.y / 78) * 100}%`,
                }}
              >
                <EquipIcon kind={eq.kind} />
              </button>
            );
          })}

          {/* Hover card */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={spring.gentle}
                className="pointer-events-none absolute z-30 w-[200px] rounded-[14px] border border-etch-strong bg-[var(--map-tooltip)] backdrop-blur-xl p-3.5 shadow-[var(--shadow-md)]"
                style={{
                  left: Math.min(Math.max(hoverPos.x + 12, 8), 220),
                  top: Math.max(hoverPos.y - 8, 8),
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-text-primary">
                    {hovered.name}
                  </p>
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: mapStatusColor[hovered.status] }}
                  />
                </div>
                <p
                  className="mt-1 text-[10px]"
                  style={{ color: mapStatusColor[hovered.status] }}
                >
                  {mapZoneStatusLabel[hovered.status]}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <HoverStat
                    label="واقعی"
                    value={`${toPersianDigits(hovered.progress)}٪`}
                  />
                  <HoverStat
                    label="برنامه"
                    value={`${toPersianDigits(hovered.planned)}٪`}
                  />
                </div>
                <p className="mt-2.5 text-[10px] text-text-secondary leading-relaxed">
                  اختلاف{" "}
                  <span className="text-text-primary">
                    {hovered.delta >= 0 ? "+" : ""}
                    {toPersianDigits(hovered.delta)}٪
                  </span>
                  <br />
                  مسئول: {hovered.owner}
                  <br />
                  بازدید: {hovered.lastVisit}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI strip — not cluttering the map */}
        <div className="border-t border-etch bg-[var(--map-panel)] px-4 py-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={12} className="text-accent" />
            <p className="text-[11px] text-accent">بینش هوش مصنوعی روی نقشه</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {mapAiPins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => openZone(pin.zoneId)}
                className={cn(
                  "shrink-0 rounded-[10px] border px-3 py-2 text-[11px] leading-snug max-w-[200px] text-right cursor-pointer transition-colors",
                  pin.tone === "danger" &&
                    "border-danger/35 bg-danger-soft text-danger",
                  pin.tone === "warn" &&
                    "border-warning/35 bg-warning-soft text-warning",
                  pin.tone === "ok" &&
                    "border-success/35 bg-success-soft text-success",
                  pin.tone === "info" &&
                    "border-accent/35 bg-accent-soft text-accent"
                )}
              >
                {pin.message}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 px-4 py-2.5 border-t border-etch text-[10px] text-text-tertiary">
          {(
            [
              ["onSchedule", "مطابق برنامه"],
              ["risk", "ریسک تأخیر"],
              ["delayed", "عقب از برنامه"],
              ["complete", "تکمیل‌شده"],
              ["notStarted", "شروع‌نشده"],
            ] as [MapZoneStatus, string][]
          ).map(([s, l]) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: mapStatusColor[s] }}
              />
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 flex items-center gap-3">
        <div className="hidden sm:block h-px flex-1 bg-gradient-to-l from-etch to-transparent" />
        <div className="flex gap-2 overflow-x-auto">
          {mapTimelineDays.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDayId(d.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-[12px] cursor-pointer transition-all",
                dayId === d.id
                  ? "bg-accent-soft text-accent border border-accent/40"
                  : "border border-etch text-text-tertiary hover:border-border-hover"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-etch to-transparent" />
      </div>
      <p className="mt-2 text-center text-[11px] text-text-tertiary">
        {day.date}
      </p>

      <AnimatePresence>
        {focus && (
          <DetailDrawer focus={focus} zones={zones} onClose={clearFocus} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Building({
  zone,
  layer,
  active,
  onEnter,
  onMove,
  onLeave,
  onClick,
}: {
  zone: ResolvedZone;
  layer: MapLayer;
  active: boolean;
  onEnter: (e: MouseEvent<SVGGElement>) => void;
  onMove: (e: MouseEvent<SVGGElement>) => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const score =
    layer === "progress" || layer === "physical"
      ? zone.progress
      : zone.layerScores[layer];
  const color =
    layer === "progress" || layer === "physical"
      ? mapStatusColor[zone.status]
      : score >= 75
        ? mapStatusColor.onSchedule
        : score >= 50
          ? mapStatusColor.risk
          : score >= 30
            ? mapStatusColor.delayed
            : mapStatusColor.notStarted;

  const elev = Math.max(0.8, zone.levels * 1.15);
  const f = buildingFaces(zone, elev);
  const label = iso(zone.x + zone.w / 2, zone.y + zone.h / 2, elev + 0.4);
  const display =
    layer === "progress" || layer === "physical" ? zone.progress : score;

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ outline: "none" }}
    >
      {/* right wall */}
      <polygon
        points={pts(f.tr, f.br, f.br0, f.tr0)}
        fill="var(--map-canvas)"
        stroke="none"
        opacity="0.9"
      />
      {/* left wall */}
      <polygon
        points={pts(f.tl, f.bl, f.bl0, f.tl0)}
        fill="var(--map-building)"
        stroke="none"
        opacity="0.95"
      />
      {/* top face */}
      <polygon
        points={pts(f.tl, f.tr, f.br, f.bl)}
        fill={`color-mix(in oklab, ${color} 32%, var(--map-building))`}
        stroke={active ? color : `${color}99`}
        strokeWidth={active ? 0.45 : 0.28}
        filter={active ? "url(#softGlow)" : undefined}
      />
      {/* glass sheen */}
      <polygon
        points={pts(f.tl, f.tr, f.br, f.bl)}
        fill="var(--etch-strong)"
        opacity="0.04"
      />

      {/* label */}
      <text
        x={label.x}
        y={label.y - 1.2}
        textAnchor="middle"
        fill="var(--text-primary)"
        fontSize="2.1"
        fontWeight="600"
        style={{ pointerEvents: "none" }}
      >
        {zone.name}
      </text>
      <text
        x={label.x}
        y={label.y + 1.6}
        textAnchor="middle"
        fill={color}
        fontSize="2.4"
        fontWeight="700"
        style={{ pointerEvents: "none" }}
      >
        {toPersianDigits(Math.round(display))}٪
      </text>

      {/* progress arc under label */}
      <circle
        cx={label.x}
        cy={label.y + 4.2}
        r="1.5"
        fill="none"
        stroke="var(--etch-strong)"
        strokeWidth="0.35"
      />
      <circle
        cx={label.x}
        cy={label.y + 4.2}
        r="1.5"
        fill="none"
        stroke={color}
        strokeWidth="0.4"
        strokeLinecap="round"
        strokeDasharray={`${(Math.min(100, display) / 100) * 9.42} 9.42`}
        transform={`rotate(-90 ${label.x} ${label.y + 4.2})`}
      />
    </g>
  );
}

function HoverStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-hover px-2 py-1.5">
      <p className="text-[9px] text-text-tertiary">{label}</p>
      <p className="text-[13px] font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

function DetailDrawer({
  focus,
  zones,
  onClose,
}: {
  focus: Exclude<Focus, null>;
  zones: ResolvedZone[];
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <motion.div
      className="fixed inset-0 z-[65] flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-overlay cursor-pointer"
        aria-label="بستن"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 32, opacity: 0 }}
        transition={spring.panel}
        className="relative ml-auto h-full w-full max-w-[400px] overflow-y-auto border-r border-etch-strong bg-map-panel shadow-[var(--shadow-md)]"
        dir="rtl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-etch bg-[var(--map-panel)] backdrop-blur px-4 py-3.5">
          <p className="text-[14px] font-semibold text-text-primary">
            {focus.type === "zone" &&
              zones.find((z) => z.id === focus.id)?.name}
            {focus.type === "camera" &&
              mapCameras.find((c) => c.id === focus.id)?.label}
            {focus.type === "equipment" &&
              mapEquipment.find((e) => e.id === focus.id)?.name}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {focus.type === "zone" && (
            <ZonePanel
              zone={zones.find((z) => z.id === focus.id)!}
              onWorkflow={(id) => router.push(`/workflows/${id}`)}
            />
          )}
          {focus.type === "camera" && (
            <CameraPanel cam={mapCameras.find((c) => c.id === focus.id)!} />
          )}
          {focus.type === "equipment" && (
            <EquipmentPanel eq={mapEquipment.find((e) => e.id === focus.id)!} />
          )}
        </div>
      </motion.aside>
    </motion.div>
  );
}

function ZonePanel({
  zone,
  onWorkflow,
}: {
  zone: ResolvedZone;
  onWorkflow: (id: string) => void;
}) {
  const images = evidenceImages.filter((i) => zone.imageIds.includes(i.id));
  const videos = evidenceVideos.filter((v) => zone.videoIds.includes(v.id));
  const docs = evidenceDocuments.filter((d) => zone.docIds.includes(d.id));

  return (
    <>
      <div className="rounded-[14px] border border-etch bg-hover p-3.5">
        <p
          className="text-[12px] font-medium"
          style={{ color: mapStatusColor[zone.status] }}
        >
          {mapZoneStatusLabel[zone.status]}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="واقعی" value={`${toPersianDigits(zone.progress)}٪`} />
          <MiniStat label="برنامه" value={`${toPersianDigits(zone.planned)}٪`} />
          <MiniStat
            label="اختلاف"
            value={`${zone.delta >= 0 ? "+" : ""}${toPersianDigits(zone.delta)}`}
          />
        </div>
        <p className="mt-3 text-[12px] text-text-secondary">مسئول: {zone.owner}</p>
      </div>

      <Block title="تحلیل AI" icon={<Sparkles size={13} className="text-accent" />}>
        <p className="text-[13px] text-accent leading-relaxed">{zone.aiNote}</p>
      </Block>

      <Block title="تصاویر این بخش">
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.src}
              alt={img.location}
              className="h-20 w-28 shrink-0 rounded-[8px] object-cover border border-etch"
            />
          ))}
          {!images.length && (
            <p className="text-[12px] text-text-tertiary">تصویری ثبت نشده</p>
          )}
        </div>
      </Block>

      <Block title="ویدئوها">
        <ul className="space-y-2">
          {videos.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-2 rounded-[8px] border border-etch px-2.5 py-2 text-[12px] text-text-secondary"
            >
              <Play size={12} className="text-primary" />
              {v.title}
            </li>
          ))}
          {!videos.length && (
            <p className="text-[12px] text-text-tertiary">ویدئویی نیست</p>
          )}
        </ul>
      </Block>

      <Block title="اسناد مرتبط" icon={<FileText size={13} />}>
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li
              key={d.id}
              className="rounded-[8px] border border-etch px-2.5 py-2 text-[11px] font-mono text-text-secondary truncate"
            >
              {d.fileName}
            </li>
          ))}
        </ul>
      </Block>

      <Block
        title="مشکلات ثبت‌شده"
        icon={<AlertTriangle size={13} className="text-warning" />}
      >
        <ul className="space-y-1.5">
          {zone.issues.map((iss) => (
            <li key={iss} className="text-[12px] text-text-secondary">
              · {iss}
            </li>
          ))}
          {!zone.issues.length && (
            <p className="text-[12px] text-success">مشکل بازی ثبت نشده</p>
          )}
        </ul>
      </Block>

      <Block title="آخرین گزارش کارگاهی">
        <p className="text-[12px] text-text-secondary leading-relaxed">
          {zone.lastReport}
        </p>
      </Block>

      <Block title="گردش‌کارهای مرتبط" icon={<GitBranch size={13} />}>
        <div className="space-y-2">
          {zone.relatedWorkflows.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onWorkflow(w.id)}
              className="w-full text-right rounded-[8px] border border-primary/30 bg-primary-soft px-3 py-2 text-[12px] text-primary cursor-pointer"
            >
              {w.name}
            </button>
          ))}
          {!zone.relatedWorkflows.length && (
            <p className="text-[12px] text-text-tertiary">گردش‌کار مرتبطی نیست</p>
          )}
        </div>
      </Block>
    </>
  );
}

function CameraPanel({ cam }: { cam: MapCamera }) {
  return (
    <>
      <div className="relative aspect-video rounded-[12px] overflow-hidden border border-etch">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cam.snapshot}
          alt={cam.label}
          className="h-full w-full object-cover"
        />
        <span className="absolute top-2 right-2 flex items-center gap-1.5 rounded-[6px] bg-overlay px-2 py-1 text-[10px] text-text-primary">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              cam.status === "online" && "bg-success animate-pulse",
              cam.status === "degraded" && "bg-warning",
              cam.status === "offline" && "bg-danger"
            )}
          />
          {cam.liveHint}
        </span>
      </div>
      <Block title="تحلیل AI" icon={<Sparkles size={13} className="text-accent" />}>
        <p className="text-[13px] text-accent leading-relaxed">
          {cam.aiAnalysis}
        </p>
      </Block>
      <Block title="وضعیت اتصال">
        <p className="text-[13px] text-text-secondary">
          همگام‌سازی: {cam.lastSync}
        </p>
      </Block>
    </>
  );
}

function EquipmentPanel({ eq }: { eq: MapEquipment }) {
  return (
    <>
      <div className="rounded-[12px] border border-etch bg-hover p-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-primary/30 bg-primary-soft text-primary">
          <EquipIcon kind={eq.kind} size={18} />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-text-primary">{eq.name}</p>
          <p className="text-[12px] text-text-tertiary">{eq.status}</p>
        </div>
      </div>
      <dl className="space-y-2 text-[12px]">
        <Row k="آخرین استفاده" v={eq.lastUse} />
        <Row k="موقعیت GPS" v={eq.gps} />
        <Row k="سلامت دستگاه" v={`${toPersianDigits(eq.health)}٪`} />
      </dl>
      <div className="h-1.5 rounded-full bg-hover overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/80"
          style={{ width: `${eq.health}%` }}
        />
      </div>
    </>
  );
}

function EquipIcon({
  kind,
  size = 12,
}: {
  kind: MapEquipment["kind"];
  size?: number;
}) {
  if (kind === "crane") return <Construction size={size} strokeWidth={1.6} />;
  if (kind === "forklift") return <Forklift size={size} strokeWidth={1.6} />;
  return <Truck size={size} strokeWidth={1.6} />;
}

function Block({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2 text-text-tertiary">
        {icon}
        <h4 className="text-[12px] font-medium">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-etch bg-hover px-1 py-2">
      <p className="text-[9px] text-text-tertiary">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-text-tertiary">{k}</dt>
      <dd className="text-text-secondary text-left">{v}</dd>
    </div>
  );
}
