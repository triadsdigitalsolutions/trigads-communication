"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    mobile?: boolean;
}

export function NavItem({ href, icon, label, mobile }: NavItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(href + "/");

    if (mobile) {
        return (
            <Link
                href={href}
                title={label}
                className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                    isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-sidebar-foreground/60 hover:text-foreground hover:bg-secondary"
                }`}
            >
                {icon}
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={`group flex items-center gap-4 w-full px-5 py-3 transition-all duration-200 ${
                isActive
                    ? "bg-[#f0f2f5] border-l-4 border-[#00a884] text-[#111b21] font-medium"
                    : "border-l-4 border-transparent text-[#54656f] hover:bg-[#f5f6f6] hover:text-[#111b21]"
            }`}
        >
            <span className={`shrink-0 ${isActive ? "text-[#00a884]" : "text-[#54656f]"}`}>
                {icon}
            </span>
            <span className="text-[15px] leading-none">{label}</span>
        </Link>
    );
}
