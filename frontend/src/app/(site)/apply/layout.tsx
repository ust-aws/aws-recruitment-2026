import { ApplyFlowTabs } from "@/components/apply/flow-tabs"

export default function ApplyLayout({ children }: LayoutProps<"/apply">) {
  return (
    <div className="pt-16">
      <ApplyFlowTabs />
      {children}
    </div>
  )
}
