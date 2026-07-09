"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavItemProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    mobile?: boolean;
    iconColor?: string;
    iconBg?: string;
}

export function NavItem({ href, icon, label, mobile, iconColor = "text-muted-foreground", iconBg = "bg-transparent" }: NavItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(href + "/");

    if (mobile) {
        return (
            <Link
                href={href}
                title={label}
                className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 active:scale-95 ${
                    isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
            >
                <div className={!isActive ? iconColor : ""}>
                    {icon}
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={`group flex items-center gap-3.5 w-full px-3 py-2.5 rounded-[12px] transition-all duration-200 active:scale-[0.98] ${
                isActive
                    ? "bg-primary/5 text-primary shadow-sm border border-primary/10"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
            }`}
        >
            <span className={`flex items-center justify-center w-[34px] h-[34px] rounded-[10px] shrink-0 transition-all duration-300 ${
                isActive 
                    ? "bg-primary text-primary-foreground shadow-glow scale-105" 
                    : `${iconBg} ${iconColor} group-hover:scale-105 group-hover:shadow-sm`
            }`}>
                {icon}
            </span>
            <span className={`text-[14px] leading-none tracking-tight transition-colors ${isActive ? "text-primary font-bold" : "group-hover:text-foreground font-semibold"}`}>
                {label}
            </span>
        </Link>
    );
}
