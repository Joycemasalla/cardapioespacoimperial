import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, Store, Phone, MapPin, Truck, Clock, QrCode, AlertTriangle, Wrench } from 'lucide-react';
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
    pix_key: '',
    opening_time: '18:00',
    closing_time: '23:30',
    closed_message: 'Estamos fechados no momento. Volte no nosso horário de funcionamento!',
    maintenance_mode: false,
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
        pix_key: settings.pix_key || '',
        opening_time: settings.opening_time || '18:00',
        closing_time: settings.closing_time || '23:30',
        closed_message: settings.closed_message || 'Estamos fechados no momento. Volte no nosso horário de funcionamento!',
        maintenance_mode: settings.maintenance_mode ?? false,
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
        pix_key: formData.pix_key || null,
        opening_time: formData.opening_time,
        closing_time: formData.closing_time,
        closed_message: formData.closed_message,
        maintenance_mode: formData.maintenance_mode,
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

        {/* Modo Manutenção */}
        <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-amber-500" />
            <div>
              <Label className="text-foreground font-medium">Modo Manutenção</Label>
              <p className="text-muted-foreground text-sm">Exibe aviso de "cardápio sendo atualizado"</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${formData.maintenance_mode ? 'text-amber-500' : 'text-muted-foreground'}`}>
              {formData.maintenance_mode ? 'Ativo' : 'Inativo'}
            </span>
            <Switch
              checked={formData.maintenance_mode}
              onCheckedChange={(checked) => setFormData({ ...formData, maintenance_mode: checked })}
            />
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="border border-border rounded-lg p-4 space-y-4">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horário de Funcionamento
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Abertura</Label>
              <Input
                type="time"
                value={formData.opening_time}
                onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Fechamento</Label>
              <Input
                type="time"
                value={formData.closing_time}
                onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            O sistema verificará automaticamente se está dentro do horário de funcionamento.
          </p>
        </div>

        {/* Mensagem de Fechado */}
        <div>
          <Label className="text-foreground flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            Mensagem quando Fechado
          </Label>
          <Textarea
            value={formData.closed_message}
            onChange={(e) => setFormData({ ...formData, closed_message: e.target.value })}
            className="bg-background border-border text-foreground resize-none"
            rows={2}
            placeholder="Mensagem exibida quando a loja está fechada..."
          />
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

        {/* Chave PIX */}
        <div>
          <Label className="text-foreground flex items-center gap-2 mb-2">
            <QrCode className="h-4 w-4" />
            Chave PIX
          </Label>
          <Input
            value={formData.pix_key}
            onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
            className="bg-background border-border text-foreground"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
          <p className="text-muted-foreground text-sm mt-1">
            Chave para receber pagamentos via PIX
          </p>
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
