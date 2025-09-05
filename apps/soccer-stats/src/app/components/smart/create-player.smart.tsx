import { useMutation } from '@apollo/client/react';
import { useCallback, useState } from 'react';

import {
  CREATE_PLAYER,
  GET_PLAYERS,
  CreatePlayerResponse,
  CreatePlayerInput,
} from '../../services/players-graphql.service';
import { CreatePlayerPresentation } from '../presentation/create-player.presentation';

interface CreatePlayerSmartProps {
  onPlayerCreated?: (player: {
    id: string;
    name: string;
    position: string;
  }) => void;
  onCancel?: () => void;
}

/**
 * Smart component for creating a new player
 */
export const CreatePlayerSmart = ({
  onPlayerCreated,
  onCancel,
}: CreatePlayerSmartProps) => {
  const [formData, setFormData] = useState<CreatePlayerInput>({
    name: '',
    position: '',
  });

  const [createPlayer, { loading, error }] = useMutation<
    CreatePlayerResponse,
    { createPlayerInput: CreatePlayerInput }
  >(CREATE_PLAYER, {
    refetchQueries: [{ query: GET_PLAYERS }],
  });

  const handleInputChange = useCallback(
    (field: keyof CreatePlayerInput, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.name.trim() || !formData.position.trim()) {
        return;
      }

      try {
        const result = await createPlayer({
          variables: {
            createPlayerInput: {
              name: formData.name.trim(),
              position: formData.position.trim(),
            },
          },
        });

        if (result.data?.createPlayer) {
          // Reset form
          setFormData({ name: '', position: '' });

          // Notify parent component
          onPlayerCreated?.(result.data.createPlayer);
        }
      } catch (err) {
        console.error('Error creating player:', err);
      }
    },
    [formData, createPlayer, onPlayerCreated]
  );

  const handleCancel = useCallback(() => {
    setFormData({ name: '', position: '' });
    onCancel?.();
  }, [onCancel]);

  const isFormValid =
    formData.name.trim().length > 0 && formData.position.trim().length > 0;

  return (
    <CreatePlayerPresentation
      formData={formData}
      loading={loading}
      error={error?.message}
      isFormValid={isFormValid}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};
