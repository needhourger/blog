/**
 * 设备展示页数据源（纯内容）。
 * 页面展示与筛选规则由 src/config/devicesConfig.ts 控制。
 */
import type { DeviceItem } from "@/types/devicesConfig";

export const devicesData: DeviceItem[] = [
/* 	{
		id: "macbook-pro-16",
		name: 'MacBook Pro 16"',
		brand: "Apple",
		category: "desk",
		status: "active",
		specs: "M3 Max / 64GB / 2TB",
		description:
			"Primary workstation for development, design, and heavy rendering workloads.",
		icon: "material-symbols:laptop-mac-rounded",
		featured: true,
		year: "2024",
		link: "https://www.apple.com/macbook-pro/",
	}, */
];

/** 获取所有设备数据列表 */
export function getDevicesList(): DeviceItem[] {
	return devicesData;
}
