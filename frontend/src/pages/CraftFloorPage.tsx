/** Craft Floor Page */

import { useCraftFloorCheck } from '@/hooks/useCraftFloor';
import { CraftFloorCheckForm } from '@/components/craft-floor/CraftFloorCheck';
import { PageHeader, MainLayout } from '@/components/layout';
import { Card, CardHeader, CardContent } from '@/components/ui';

export function CraftFloorPage() {
  const checkMutation = useCraftFloorCheck();

  const handleCheck = async (request: { file_path: string; content_before: string; content_after: string }) => {
    await checkMutation.mutateAsync(request);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Craft Floor"
        description="Check your UI changes against quality rules before committing. The craft floor enforces absolute bans on layout thrash, raw CSS injection, and physical properties on RTL pages."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CraftFloorCheckForm
            onCheck={handleCheck}
            loading={checkMutation.isPending}
            result={checkMutation.data || null}
          />
        </div>

        <div>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Built-in Rules</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Absolute bans that cannot be overridden
              </p>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
                  <span className="text-red-600">🚫</span> Layout Thrash
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">Animating width/height/top/left causes layout thrash. Use transform instead.</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
                  <span className="text-red-600">🚫</span> Raw CSS Injection
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">Injecting raw CSS without sanitization leaks styles site-wide.</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
                  <span className="text-red-600">🚫</span> Physical Props on RTL
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">margin-left, float: left, etc. break RTL layouts. Use logical properties.</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <span className="text-amber-600">⚠</span> Magic Numbers
                </h4>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">Hardcoded pixel values instead of design tokens.</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <h4 className="font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <span className="text-amber-600">⚠</span> Contrast
                </h4>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">Color combinations may not meet WCAG AA.</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <span className="text-blue-600">💡</span> Consistent Tokens
                </h4>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">Similar values used inconsistently; consolidate into tokens.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}