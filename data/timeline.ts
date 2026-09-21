/**
 * 时间线页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/timelineConfig.ts 控制。
 */
import type { TimelineItem } from "@/types/timelineConfig";

export const timelineData: TimelineItem[] = [
/* 	{
		title: "Shirone Theme M3E Major Architecture Upgrade",
		date: "2026.08",
		category: "milestone",
		subtitle: "Open Source Project",
		description:
			"Refactored the entire blog theme into a Material 3 Expressive atomic component system with token-driven styling, complete keyboard navigation, and full accessibility compliance.",
		highlights: [
			"Implemented dynamic HCT palette calculation and state layer tokens",
			"Added multi-page capabilities: Timeline, Skills, Projects, and Protected Albums",
			"Zero-error strict type-checking and automated visual regression locks",
		],
		tags: ["Astro", "Svelte 5", "M3E", "Tailwind 4"],
		links: [
			{
				label: "GitHub Repository",
				url: "https://github.com/LyraVoid/Shirone",
				icon: "fa6-brands:github",
			},
		],
		icon: "material-symbols:rocket-launch-rounded",
		featured: true,
	}, */
];

/** 获取所有时间线数据列表 */
export function getTimelineList(): TimelineItem[] {
	return timelineData;
}
