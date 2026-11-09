/** Design System Card Component */

import { cn, formatRelativeTime } from '../../utils/helpers';
import { Edit, Trash2, Download, ExternalLink } from 'lucide-react';
import type { DesignSystem } from '../../types/api';
import { Button, Card, CardHeader, CardContent } from '../ui/components';

interface DesignSystemCardProps {
  designSystem: DesignSystem;
  onDelete?: (id: number) => void;
  onClick?: () => void;
}

export function DesignSystemCard({ designSystem, onDelete, onClick }: DesignSystemCardProps) {
  const tokenCounts = {
    typeScale: designSystem.type_scale?.tokens?.length || 0,
    colorPalette: designSystem.color_palette?.tokens?.length || 0,
    spacing: designSystem.spacing?.tokens?.length || 0,
    componentPatterns: designSystem.component_patterns?.tokens?.length || 0,
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', onClick && 'cursor-pointer')} onClick={onClick}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{designSystem.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[300px]">{designSystem.root_path}</p>
          </div>
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(designSystem.id)} title="Delete">
              <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-slate-500 dark:text-slate-400">Type Scale</div>
          <div className="font-mono text-slate-900 dark:text-slate-100">{tokenCounts.typeScale}</div>
          <div className="text-slate-500 dark:text-slate-400">Color Palette</div>
          <div className="font-mono text-slate-900 dark:text-slate-100">{tokenCounts.colorPalette}</div>
          <div className="text-slate-500 dark:text-slate-400">Spacing</div>
          <div className="font-mono text-slate-900 dark:text-slate-100">{tokenCounts.spacing}</div>
          <div className="text-slate-500 dark:text-slate-400">Components</div>
          <div className="font-mono text-slate-900 dark:text-slate-100">{tokenCounts.componentPatterns}</div>
        </div>
        <div className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Updated {formatRelativeTime(designSystem.updated_at)}
        </div>
      </CardContent>
    </Card>
  );
}

// Design System Detail View
interface DesignSystemDetailProps {
  designSystem: DesignSystem;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNewAudit: () => void;
}

export function DesignSystemDetail({ designSystem, onBack, onEdit, onDelete, onNewAudit }: DesignSystemDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <button onClick={onBack} className="mb-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{designSystem.name}</h1>
          <p className="text-slate-500 dark:text-slate-400">{designSystem.root_path}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit}><Edit className="h-4 w-4 mr-2" />Edit</Button>
          <Button variant="danger" onClick={onDelete}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
          <Button onClick={onNewAudit}><ExternalLink className="h-4 w-4 mr-2" />New Audit</Button>
        </div>
      </div>

      {designSystem.design_md && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">DESIGN.md</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const designMd = designSystem.design_md;
                if (!designMd) return;
                const blob = new Blob([designMd], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${designSystem.name.toLowerCase().replace(/\s+/g, '-')}-design.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              title="Download DESIGN.md"
            >
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm">{designSystem.design_md}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TokenSection title="Type Scale" tokens={designSystem.type_scale?.tokens || []} />
        <TokenSection title="Color Palette" tokens={designSystem.color_palette?.tokens || []} />
        <TokenSection title="Spacing" tokens={designSystem.spacing?.tokens || []} />
        <TokenSection title="Component Patterns" tokens={designSystem.component_patterns?.tokens || []} />
      </div>
    </div>
  );
}

interface TokenSectionProps {
  title: string;
  tokens: Array<{ value: string; count: number }>;
}

function TokenSection({ title, tokens }: TokenSectionProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No tokens found</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {tokens.map((token, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{token.value}</code>
                <span className="text-slate-500 dark:text-slate-400">×{token.count}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
