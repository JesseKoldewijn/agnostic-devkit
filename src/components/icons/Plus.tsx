import { cn } from "@/utils/cn"
import { splitProps, type Component } from "solid-js"
import type { GenericSVGProps } from "./types"

export const PlusIcon: Component<GenericSVGProps> = (props) => {
    const [local, rest] = splitProps(props, ["class"])
    
  return (
    <svg {...rest} class={cn("size-3.5 opacity-70", local.class)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  )
}
