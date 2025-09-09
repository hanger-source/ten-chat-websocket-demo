import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input component
import { Textarea } from '@/components/ui/textarea'; // Import Textarea component
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox component
import { Label } from '@/components/ui/label'; // Import Label component
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react'; // Import Info icon
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
  const { editingScene, updateEditingModelOptions, getSelectedModelId, getFilteredConfigurableOptions } = useAiPersonalEdit();

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [configurableOptions, setConfigurableOptions] = useState<IConfigurableOption[]>([]);

  useEffect(() => {
    if (showModal && modelKeyToConfig) {
      const selectedModelId = getSelectedModelId(modelKeyToConfig);

      // 根据 selectedModelId 和 supportModels 过滤配置选项
      const filteredOptions = getFilteredConfigurableOptions(modelKeyToConfig, selectedModelId);

      setConfigurableOptions(filteredOptions);

      const initialFormValues: Record<string, any> = {};
      filteredOptions.forEach(option => {
        // Initialize form values from current editing scene's model config,
        // then fall back to option.defaultValue, then to an empty string.
        initialFormValues[option.key] = editingScene?.selectedModelsOptions?.[modelKeyToConfig]?.[option.key]
          ?? option.defaultValue
          ?? '';
      });
      setFormValues(initialFormValues);
    }
  }, [showModal, modelKeyToConfig, editingScene, getSelectedModelId, getFilteredConfigurableOptions]);

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
            value={option.readOnly && !value ? option.description : value} // Display description if readOnly and value is empty
            onChange={(e) => handleInputChange(option.key, e.target.value)}
            placeholder={option.description}
            readOnly={option.readOnly} // Add readOnly attribute
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={option.readOnly && !value ? option.description : value} // Display description if readOnly and value is empty
            onChange={(e) => handleInputChange(option.key, e.target.value)}
            placeholder={option.description}
            readOnly={option.readOnly} // Add readOnly attribute
          />
        );
      case 'boolean':
        return (
          <Checkbox
            checked={value}
            onCheckedChange={(checked) => handleInputChange(option.key, checked)}
            disabled={option.readOnly} // Use disabled for Checkbox
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={option.readOnly && !value ? option.description : value} // Display description if readOnly and value is empty
            onChange={(e) => handleInputChange(option.key, e.target.value)}
            placeholder={option.description}
            readOnly={option.readOnly} // Add readOnly attribute
          />
        );
      case 'link': // Add new case for 'link' type
        return (
          option.readOnly && value ? (
            <a 
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline cursor-pointer text-base block break-all"
            >
              {value}
            </a>
          ) : (
            <Input
              type="url" // Use type="url" for link inputs
              value={option.readOnly && !value ? option.description : value} // Display description if readOnly and value is empty
              onChange={(e) => handleInputChange(option.key, e.target.value)}
              placeholder={option.description}
              readOnly={option.readOnly} // Add readOnly attribute
            />
          )
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
                <Label htmlFor={option.key} className="flex items-center space-x-1">
                  <span>{option.name}</span>
                  {option.description && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{option.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </Label>
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
