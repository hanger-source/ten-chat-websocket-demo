import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input component
import { Textarea } from '@/components/ui/textarea'; // Import Textarea component
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox component
import { Label } from '@/components/ui/label'; // Import Label component
import { IConfigurableOption, ConfigurableOptionType } from '@/types/modeOptions';
import { useAiPersonalEdit } from '../../../../hooks/useAiPersonalEdit';

const BASE_BORDER_GRADIENT = "bg-gradient-to-br from-blue-400 to-pink-400 via-purple-400";
const BORDER_GRADIENT_CLASSES = BASE_BORDER_GRADIENT;

interface ConfigModelOptionDialogProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  modelKeyToConfig: string | null;
}

const ConfigModelOptionDialog: React.FC<ConfigModelOptionDialogProps> = ({ showModal, setShowModal, modelKeyToConfig }) => {
  const { editingScene, updateEditingModelOptions, getAvailableModelOptions } = useAiPersonalEdit();

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [configurableOptions, setConfigurableOptions] = useState<IConfigurableOption[]>([]);

  useEffect(() => {
    if (showModal && modelKeyToConfig) {
      const availableModelConfig = getAvailableModelOptions(modelKeyToConfig);
      const options = availableModelConfig?.configurableOptions || [];
      setConfigurableOptions(options);

      const initialFormValues: Record<string, any> = {};
      options.forEach(option => {
        // Initialize form values from current editing scene's model config, or default if not set
        initialFormValues[option.key] = editingScene?.selectedModelsOptions?.[modelKeyToConfig]?.[option.key] ?? '';
      });
      setFormValues(initialFormValues);
    }
  }, [showModal, modelKeyToConfig, editingScene, getAvailableModelOptions]);

  const handleInputChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (modelKeyToConfig) {
      updateEditingModelOptions(modelKeyToConfig, formValues);
      setShowModal(false);
    }
  };

  const renderFormElement = (option: IConfigurableOption) => {
    const value = formValues[option.key];
    switch (option.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(option.key, e.target.value)}
            placeholder={option.description}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(option.key, e.target.value)}
            placeholder={option.description}
          />
        );
      case 'boolean':
        return (
          <Checkbox
            checked={value}
            onCheckedChange={(checked) => handleInputChange(option.key, checked)}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(option.key, e.target.value)}
            placeholder={option.description}
          />
        );
      // Add more cases for other types if needed (e.g., 'select')
      default:
        return null;
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>配置模型选项</DialogTitle>
          <DialogDescription>
            为当前模型配置自定义选项。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {configurableOptions.length === 0 ? (
            <p className="text-gray-500">此模型没有可配置的选项。</p>
          ) : (
            configurableOptions.map(option => (
              <div key={option.key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={option.key} className="">{option.name}</Label>
                <div className="col-span-3">
                  {renderFormElement(option)}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowModal(false)} className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none" style={{ outline: 'none', boxShadow: 'none' }}>取消</Button>
          <Button className={`${BORDER_GRADIENT_CLASSES} text-white transition-all duration-200 shadow-lg hover:shadow-lg hover:scale-100 transform-gpu will-change-[transform,background-color,color]`} onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigModelOptionDialog;
