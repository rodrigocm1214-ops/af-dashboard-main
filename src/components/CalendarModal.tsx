import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Activity, Database } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPeriodSelect?: (period: string) => void;
}

interface PeriodData {
  period: string;
  year: string;
  month: string;
  projectsCount: number;
  hasData: boolean;
}

export function CalendarModal({ open, onOpenChange, onPeriodSelect }: CalendarModalProps) {
  const { projects } = useProjects();
  const [availablePeriods, setAvailablePeriods] = useState<PeriodData[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [years, setYears] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadAvailablePeriods();
    }
  }, [open, projects]);

  const loadAvailablePeriods = () => {
    const allPeriods = new Map<string, PeriodData>();
    const yearsSet = new Set<string>();

    projects.forEach(project => {
      const storageKey = `project-data-${project.id}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const projectData = JSON.parse(stored);
          projectData.periods?.forEach((period: any) => {
            const periodKey = `${period.year}-${period.month}`;
            yearsSet.add(period.year);
            
            if (allPeriods.has(periodKey)) {
              const existing = allPeriods.get(periodKey)!;
              allPeriods.set(periodKey, {
                ...existing,
                projectsCount: existing.projectsCount + 1,
                hasData: existing.hasData || (period.metaAds?.length > 0 || period.sales?.length > 0)
              });
            } else {
              allPeriods.set(periodKey, {
                period: periodKey,
                year: period.year,
                month: period.month,
                projectsCount: 1,
                hasData: period.metaAds?.length > 0 || period.sales?.length > 0
              });
            }
          });
        } catch (error) {
          console.error(`Error loading periods for project ${project.id}:`, error);
        }
      }
    });

    const sortedYears = Array.from(yearsSet).sort().reverse();
    setYears(sortedYears);
    
    if (sortedYears.length > 0 && !sortedYears.includes(selectedYear)) {
      setSelectedYear(sortedYears[0]);
    }

    setAvailablePeriods(Array.from(allPeriods.values()));
  };

  const formatPeriodLabel = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]}`;
  };

  const getMonthsForYear = (year: string) => {
    return availablePeriods
      .filter(p => p.year === year)
      .sort((a, b) => parseInt(a.month) - parseInt(b.month));
  };

  const handlePeriodClick = (period: string) => {
    onPeriodSelect?.(period);
    onOpenChange(false);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const currentIndex = years.indexOf(selectedYear);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    }
  };

  const monthsInYear = getMonthsForYear(selectedYear);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Navegação por Períodos</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Year Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateYear('prev')}
              disabled={years.indexOf(selectedYear) === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h3 className="text-lg font-semibold">{selectedYear}</h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateYear('next')}
              disabled={years.indexOf(selectedYear) === years.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Months Grid */}
          {monthsInYear.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {monthsInYear.map((periodData) => (
                <Card
                  key={periodData.period}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    periodData.hasData 
                      ? 'border-primary/50 bg-primary/5 hover:bg-primary/10' 
                      : 'border-muted bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => handlePeriodClick(periodData.period)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        {formatPeriodLabel(periodData.period)}
                      </h4>
                      {periodData.hasData ? (
                        <Activity className="h-4 w-4 text-primary" />
                      ) : (
                        <Database className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {periodData.projectsCount} projeto{periodData.projectsCount !== 1 ? 's' : ''}
                      </span>
                      <Badge 
                        variant={periodData.hasData ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {periodData.hasData ? 'Com dados' : 'Sem dados'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum período encontrado para {selectedYear}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Faça upload de dados para ver os períodos disponíveis
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-primary" />
              <span>Período com dados</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-3 w-3 text-muted-foreground" />
              <span>Período sem dados</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}