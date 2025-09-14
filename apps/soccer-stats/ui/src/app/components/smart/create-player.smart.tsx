import { useMutation } from '@apollo/client/react';
import { useCallback, useState } from 'react';

import {
  CREATE_PLAYER,
  GET_PLAYERS,
  CreatePlayerResponse,
  CreatePlayerInput,
} from '../../services/players-graphql.service';
import { UICreatePlayerInput } from '../types/ui.types';
import { mapUICreatePlayerToService } from '../utils/data-mapping.utils';
import { CreatePlayerPresentation } from '../presentation/create-player.presentation';

interface CreatePlayerSmartProps {
  onPlayerCreated?: (player: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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
  const [formData, setFormData] = useState<UICreatePlayerInput>({
    firstName: '',
    lastName: '',
    email: '',
    passwordHash: 'temporary', // TODO: Implement proper password handling
    position: '',
  });

  const [createPlayer, { loading, error }] = useMutation<
    CreatePlayerResponse,
    { createPlayerInput: CreatePlayerInput }
  >(CREATE_PLAYER, {
    refetchQueries: [{ query: GET_PLAYERS }],
  });

  const handleInputChange = useCallback(
    (field: keyof UICreatePlayerInput, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.email.trim()
      ) {
        return;
      }

      try {
        const serviceInput = mapUICreatePlayerToService(formData);
        const result = await createPlayer({
          variables: {
            createPlayerInput: serviceInput,
          },
        });

        if (result.data?.createPlayer) {
          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            passwordHash: 'temporary',
            position: '',
          });

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
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      passwordHash: 'temporary',
      position: '',
    });
    onCancel?.();
  }, [onCancel]);

  const isFormValid =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.email.trim().length > 0;

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
