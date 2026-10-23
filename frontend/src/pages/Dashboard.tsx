/** Dashboard Page */

import { useDesignSystems, useExtractDesignSystem, useDeleteDesignSystem } from '@/hooks/useDesignSystems';
import { DesignSystemCard, DesignSystemDetail } from '@/components/design-system/DesignSystemCard';
import { PageHeader, MainLayout } from '@/components/layout';
import { Button, Input, Card, CardHeader, CardContent, Alert, EmptyState } from '@/components/ui';
import { Plus, FolderOpen, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function Dashboard() {
  const [page, setPage] = useState(1);
  const [showExtract, setShowExtract] = useState(false);
  const [extractPath, setExtractPath] = useState('');
  const [extractName, setExtractName] = useState('');
  const [viewDetailId, setViewDetailId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useDesignSystems(page, 12);
  const extractMutation = useExtractDesignSystem();
  const deleteMutation = useDeleteDesignSystem();

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await extractMutation.mutateAsync({
        root_path: extractPath,
        name: extractName || undefined,
      });
      setShowExtract(false);
      setExtractPath('');
      setExtractName('');
      refetch();
    } catch (err) {
      console.error('Extraction failed:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this design system? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      if (viewDetailId === id) setViewDetailId(null);
      refetch();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (viewDetailId && data) {
    const ds = data.items.find(d => d.id === viewDetailId);
    if (ds) {
      return (
        <MainLayout>
          <DesignSystemDetail
            designSystem={ds}
            onBack={() => setViewDetailId(null)}
            onEdit={() => {}}
            onDelete={() => handleDelete(ds.id)}
            onNewAudit={() => {}}
          />
        </MainLayout>
      );
    }
  }

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Manage and extract design systems"
        action={
          <Button onClick={() => setShowExtract(true)}>
            <Plus className="h-4 w-4 mr-2" /> Extract New
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-6">
          Failed to load design systems: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title="No design systems yet"
          description="Extract your first design system to get started"
          action={
            <Button onClick={() => setShowExtract(true)}>
              <Plus className="h-4 w-4 mr-2" /> Extract Now
            </Button>
          }
        />
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {data.items.map((ds) => (
              <DesignSystemCard
                key={ds.id}
                designSystem={ds}
                onClick={() => setViewDetailId(ds.id)}
                onDelete={() => handleDelete(ds.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.total > data.page_size && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {Math.ceil(data.total / data.page_size)}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(data.total / data.page_size), p + 1))} disabled={page >= Math.ceil(data.total / data.page_size)}>
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title="No data"
          description="Unable to load design systems."
        />
      )}

      {/* Extract Modal */}
      {showExtract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Extract Design System</h2>
              <button onClick={() => setShowExtract(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExtract} className="space-y-4">
                <Input
                  label="Root Path"
                  value={extractPath}
                  onChange={(e) => setExtractPath(e.target.value)}
                  placeholder="/path/to/project"
                  required
                  hint="Absolute path to the project root"
                />
                <Input
                  label="Name (optional)"
                  value={extractName}
                  onChange={(e) => setExtractName(e.target.value)}
                  placeholder="My Design System"
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowExtract(false)}>Cancel</Button>
                  <Button type="submit" disabled={extractMutation.isPending}>
                    {extractMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''} Extract
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}