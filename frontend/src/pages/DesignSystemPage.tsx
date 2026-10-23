/** Design System Detail Page */

import { useDesignSystem, useDeleteDesignSystem } from '@/hooks/useDesignSystems';
import { useAudits, useRunAudit, useDeleteAudit } from '@/hooks/useAudits';
import { useParams, useNavigate } from 'react-router-dom';
import { DesignSystemDetail } from '@/components/design-system/DesignSystemCard';
import { AuditCard } from '@/components/audit/AuditCard';
import { PageHeader, MainLayout, Breadcrumbs } from '@/components/layout';
import { Button, Input, Card, CardHeader, CardContent, Alert, EmptyState } from '@/components/ui';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { DesignAudit } from '@/types/api';

export function DesignSystemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dsId = parseInt(id || '0', 10);
  const [page, setPage] = useState(1);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditPath, setAuditPath] = useState('');
  const [auditUrl, setAuditUrl] = useState('');
  const [auditRtl, setAuditRtl] = useState(false);
  const [auditHtml, setAuditHtml] = useState('');

  const { data: designSystem, isLoading: dsLoading, error: dsError } = useDesignSystem(dsId);
  const { data: auditsData, isLoading: auditsLoading, refetch: refetchAudits } = useAudits(dsId, page, 10);
  const deleteMutation = useDeleteDesignSystem();
  const runAuditMutation = useRunAudit();
  const deleteAuditMutation = useDeleteAudit();

  const handleDelete = async () => {
    if (!confirm('Delete this design system and all its audits? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(dsId);
      navigate('/');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await runAuditMutation.mutateAsync({
        design_system_id: dsId,
        target_path: auditPath,
        target_url: auditUrl || undefined,
        is_rtl: auditRtl,
        html_content: auditHtml || undefined,
      });
      setShowAuditModal(false);
      setAuditPath('');
      setAuditUrl('');
      setAuditRtl(false);
      setAuditHtml('');
      refetchAudits();
    } catch (err) {
      console.error('Audit failed:', err);
    }
  };

  const handleDeleteAudit = async (auditId: number) => {
    if (!confirm('Delete this audit?')) return;
    try {
      await deleteAuditMutation.mutateAsync({ designSystemId: dsId, auditId });
      refetchAudits();
    } catch (err) {
      console.error('Delete audit failed:', err);
    }
  };

  if (dsLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (dsError || !designSystem) {
    return (
      <MainLayout>
        <Alert variant="error">Design system not found</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Design Systems', href: '/design-systems' },
        { label: designSystem.name },
      ]} />

      <DesignSystemDetail
        designSystem={designSystem}
        onBack={() => navigate('/design-systems')}
        onEdit={() => {}}
        onDelete={handleDelete}
        onNewAudit={() => setShowAuditModal(true)}
      />

      {/* Audits Section */}
      <div className="mt-8">
        <PageHeader
          title="Audits"
          description="Design audit results for this design system"
          action={
            <Button onClick={() => setShowAuditModal(true)}>
              <Plus className="h-4 w-4 mr-2" /> Run Audit
            </Button>
        }
        />

        {auditsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>
            ))}
          </div>
        ) : !auditsData || auditsData.items.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No audits yet"
            description="Run a design audit on a page or component to see results here."
            action={
              <Button onClick={() => setShowAuditModal(true)}>
                <Plus className="h-4 w-4 mr-2" /> Run First Audit
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-4">
              {auditsData.items.map((audit: DesignAudit) => (
                <AuditCard
                  key={audit.id}
                  audit={audit}
                  onView={(id) => navigate(`/design-systems/${dsId}/audits/${id}`)}
                  onDelete={handleDeleteAudit}
                />
              ))}
            </div>

            {auditsData.total > auditsData.page_size && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Page {page} of {Math.ceil(auditsData.total / auditsData.page_size)}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(auditsData.total / auditsData.page_size)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Audit Modal */}
        {showAuditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Run Design Audit</h2>
                <button onClick={() => setShowAuditModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRunAudit} className="space-y-4">
                  <Input
                    label="Target Path"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuditPath(e.target.value)}
                    required
                  />
                  <Input
                    label="Target URL (optional)"
                    value={auditUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuditUrl(e.target.value)}
                    placeholder="https://example.com/page"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="audit-rtl"
                      checked={auditRtl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuditRtl(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="audit-rtl" className="text-sm text-slate-700 dark:text-slate-300">
                      Page uses RTL direction
                    </label>
                  </div>
                  <div>
                    <label htmlFor="audit-html" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      HTML Content (optional)
                    </label>
                    <textarea
                      id="audit-html"
                      value={auditHtml}
                      onChange={(e) => setAuditHtml(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Paste HTML content for direct analysis..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowAuditModal(false)}>Cancel</Button>
                    <Button type="submit" disabled={runAuditMutation.isPending}>
                      {runAuditMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ''} Run Audit
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}