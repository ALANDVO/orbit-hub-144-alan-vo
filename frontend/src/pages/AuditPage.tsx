/** Audit Detail Page */

import { useAudit, useDeleteAudit } from '@/hooks/useAudits';
import { useParams, useNavigate } from 'react-router-dom';
import { AuditDetail } from '@/components/audit/AuditCard';
import { MainLayout, Breadcrumbs } from '@/components/layout';
import { Alert } from '@/components/ui';
import { useDesignSystem } from '@/hooks/useDesignSystems';

export function AuditPage() {
  const { id, auditId } = useParams<{ id: string; auditId: string }>();
  const navigate = useNavigate();
  const dsId = parseInt(id || '0', 10);
  const auditIdNum = parseInt(auditId || '0', 10);

  const { data: designSystem } = useDesignSystem(dsId);
  const { data: audit, isLoading, error } = useAudit(dsId, auditIdNum);
  const deleteMutation = useDeleteAudit();

  const handleDelete = async () => {
    if (!confirm('Delete this audit?')) return;
    try {
      await deleteMutation.mutateAsync({ designSystemId: dsId, auditId: auditIdNum });
      navigate(`/design-systems/${dsId}`);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !audit) {
    return (
      <MainLayout>
        <Alert variant="error">Audit not found</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Design Systems', href: '/design-systems' },
        { label: designSystem?.name || 'Design System', href: `/design-systems/${dsId}` },
        { label: 'Audits', href: `/design-systems/${dsId}` },
        { label: `Audit #${audit.id}` },
      ]} />

      <AuditDetail
        audit={audit}
        onBack={() => navigate(`/design-systems/${dsId}`)}
        onDelete={handleDelete}
      />
    </MainLayout>
  );
}