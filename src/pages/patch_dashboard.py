#!/usr/bin/env python3
"""Run this from ~/Desktop/igoia/apps/admin/src/pages/"""
import os

# Patch Dashboard.tsx
with open('Dashboard.tsx', 'r') as f:
    dash = f.read()

if 'BotMetrics' not in dash:
    dash = dash.replace(
        "import Onboarding from './Onboarding'",
        "import Onboarding from './Onboarding'\nimport BotMetrics from './BotMetrics'"
    )
    dash = dash.replace(
        "const [page, setPage] = useState('dashboard')",
        "const [page, setPage] = useState('dashboard')\n  const [botClientId, setBotClientId] = useState('')\n  const [botClientName, setBotClientName] = useState('')"
    )
    dash = dash.replace(
        "case 'clients':\n        return <Clients />",
        "case 'clients':\n        return <Clients onViewBot={(id: string, name: string) => { setBotClientId(id); setBotClientName(name); setPage('bot-metrics') }} />\n      case 'bot-metrics':\n        return <BotMetrics clientId={botClientId} clientName={botClientName} onBack={() => setPage('clients')} />"
    )
    with open('Dashboard.tsx', 'w') as f:
        f.write(dash)
    print("Dashboard.tsx updated!")
else:
    print("Dashboard.tsx already patched")

# Patch Clients.tsx
with open('Clients.tsx', 'r') as f:
    cli = f.read()

if 'onViewBot' not in cli:
    cli = cli.replace(
        "export default function Clients() {",
        "export default function Clients({ onViewBot }: { onViewBot?: (id: string, name: string) => void }) {"
    )
    with open('Clients.tsx', 'w') as f:
        f.write(cli)
    print("Clients.tsx updated!")
else:
    # Fix the button action if needed
    cli = cli.replace(
        'e.stopPropagation(); window.open("/bot/" + c.id, "_blank")',
        "e.stopPropagation(); onViewBot && onViewBot(c.id, c.business_name)"
    )
    with open('Clients.tsx', 'w') as f:
        f.write(cli)
    print("Clients.tsx button fixed!")

print("Done! Now run: cd ~/Desktop/igoia/apps/admin && npx vite build && cd dist && npx vercel deploy . --prod")
