import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Store, Phone, MapPin, Truck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Settings } from '@/types';
import { useUpdateSettings } from '@/hooks/useSettings';

interface SettingsPanelProps {
  settings: Settings | null;
}

export function SettingsPanel({ settings }: SettingsPanelProps) {
  const [formData, setFormData] = useState({
    whatsapp_number: '',
    store_name: '',
    store_address: '',
    delivery_fee: '',
    is_open: true,
  });

  const updateSettings = useUpdateSettings();

  useEffect(() => {
    if (settings) {
      setFormData({
        whatsapp_number: settings.whatsapp_number || '',
        store_name: settings.store_name || '',
        store_address: settings.store_address || '',
        delivery_fee: String(settings.delivery_fee || 0),
        is_open: settings.is_open ?? true,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        whatsapp_number: formData.whatsapp_number,
        store_name: formData.store_name || null,
        store_address: formData.store_address || null,
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        is_open: formData.is_open,
      });
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
        ⚙️ Configurações da Loja
      </h2>

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Status da Loja */}
        <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <Label className="text-foreground font-medium">Status da Loja</Label>
              <p className="text-muted-foreground text-sm">Definir se a loja está aberta para pedidos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${formData.is_open ? 'text-green-500' : 'text-red-500'}`}>
              {formData.is_open ? 'Aberta' : 'Fechada'}
            </span>
            <Switch
              checked={formData.is_open}
              onCheckedChange={(checked) => setFormData({ ...formData, is_open: checked })}
            />
          </div>
        </div>

        {/* Nome da Loja */}
        <div>
          <Label className="text-foreground flex items-center gap-2 mb-2">
            <Store className="h-4 w-4" />
            Nome da Loja
          </Label>
          <Input
            value={formData.store_name}
            onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
            className="bg-background border-border text-foreground"
            placeholder="Espaço Imperial"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <Label className="text-foreground flex items-center gap-2 mb-2">
            <Phone className="h-4 w-4" />
            Número do WhatsApp
          </Label>
          <Input
            value={formData.whatsapp_number}
            onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
            className="bg-background border-border text-foreground"
            placeholder="5511999999999"
          />
          <p className="text-muted-foreground text-sm mt-1">
            Formato: código do país + DDD + número (sem espaços ou símbolos)
          </p>
        </div>

        {/* Endereço */}
        <div>
          <Label className="text-foreground flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            Endereço da Loja
          </Label>
          <Input
            value={formData.store_address}
            onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
            className="bg-background border-border text-foreground"
            placeholder="Rua Example, 123 - Bairro"
          />
        </div>

        {/* Taxa de Entrega */}
        <div>
          <Label className="text-foreground flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4" />
            Taxa de Entrega (R$)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={formData.delivery_fee}
            onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
            className="bg-background border-border text-foreground w-32"
            placeholder="0.00"
          />
        </div>

        {/* Botão Salvar */}
        <div className="pt-4 border-t border-border">
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}