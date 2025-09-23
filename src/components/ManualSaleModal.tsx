import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, DollarSign, Package, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface ManualSaleData {
  date: string;
  product: string;
  gross: number;
  net: number;
}

interface ManualSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSale: (sale: ManualSaleData) => Promise<void>;
}

export function ManualSaleModal({ open, onOpenChange, onAddSale }: ManualSaleModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ManualSaleData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      product: '',
      gross: 0,
      net: 0,
    },
  });

  const onSubmit = async (data: ManualSaleData) => {
    setIsLoading(true);
    try {
      await onAddSale(data);
      form.reset();
      onOpenChange(false);
      toast({
        title: "Venda adicionada com sucesso!",
        description: `Venda do produto "${data.product}" foi registrada.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar venda",
        description: "Ocorreu um erro ao registrar a venda. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrossChange = (value: string) => {
    const gross = parseFloat(value) || 0;
    form.setValue('gross', gross);
    // Calculate net as 85% of gross (typical after fees)
    const net = gross * 0.85;
    form.setValue('net', parseFloat(net.toFixed(2)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Adicionar Venda Manual</span>
          </DialogTitle>
          <DialogDescription>
            Registre vendas de outras plataformas ou canais não automatizados.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Data da Venda</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>Produto</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do produto"
                      {...field}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gross"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Valor Bruto (R$)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleGrossChange(e.target.value);
                      }}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="net"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Valor Líquido (R$)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-primary hover:bg-primary/90"
              >
                {isLoading ? "Adicionando..." : "Adicionar Venda"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}