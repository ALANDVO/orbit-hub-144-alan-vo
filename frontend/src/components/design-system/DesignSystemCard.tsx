/** Design System Card Component */

import { cn, formatRelativeTime } from '../../utils/helpers';
import { Edit, Trash2, FileText, Download, ExternalLink } from 'lucide-react';
import type { DesignSystem } from '../../types/api';
import { Button, Dropdown, Card, CardHeader, CardContent, Badge } from '../ui/components';

interface DesignSystemCardProps {
  designSystem: DesignSystem;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onViewDesignMd?: (id: number) => void;
  onClick?: () => void;
}
 
 export function DesignSystemCard({ designSystem, onEdit, onDelete, onViewDesignMd, onClick }: DesignSystemCardProps) {
  const tokenCounts = {
    type: designSystem.type_scale?.tokens.length || 0,
    color: designSystem.color_palette?.tokens.length || 0,
    spacing: designSystem.spacing?.tokens.length || 0,
    components: designSystem.component_patterns?.tokens.length || 0,
  };

  const dropdownItems = [
    {
      label: 'View DESIGN.md',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onViewDesignMd?.(designSystem.id),
    },
    {
      label: 'Download DESIGN.md',
      icon: <Download className="h-4 w-4" />,
      onClick: () => {
        if (designSystem.design_md) {
          const blob = new Blob([designSystem.design_md], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `DESIGN-${designSystem.name.replace(/\s+/g, '-')}.md`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => onEdit?.(designSystem.id),
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => onDelete?.(designSystem.id),
      danger: true,
    },
  ];

  return (
    <Card className={cn('hover:shadow-md transition-shadow', onClick && 'cursor-pointer')} onClick={onClick}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{designSystem.name}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">{designSystem.root_path}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Updated {formatRelativeTime(designSystem.updated_at)}</p>
        </div>
        <Dropdown trigger={<Button variant="ghost" size="sm" aria-label="More options"><svg className="h-5 w-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></svg></Button>} items={dropdownItems} align="right" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tokenCounts.type}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Type Scale</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tokenCounts.color}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Colors</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tokenCounts.spacing}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Spacing</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tokenCounts.components}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Components</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {designSystem.design_md && (
            <Badge variant="success" size="sm">DESIGN.md generated</Badge>
          )}
          <Badge variant="info" size="sm">{tokenCounts.type + tokenCounts.color + tokenCounts.spacing + tokenCounts.components} total tokens</Badge>
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
          <CardHeader>
            <h2 className="text-xl font-semibold">DESIGN.md</h2>
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
      <CardHeader className="pb-2">
        <h3 className="font-medium text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{tokens.length} tokens</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tokens.slice(0, 20).map((token, index) => (
            <div key={index} className="flex items-center justify-between text-sm px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <code className="text-slate-700 dark:text-slate-300 font-mono text-xs truncate max-w-[60%]">{token.value}</code>
              <Badge variant="default" size="sm">{token.count}</Badge>
            </div>
          ))}
          {tokens.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No tokens detected</p>
          )}
          {tokens.length > 20 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">+{tokens.length - 20} more</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}