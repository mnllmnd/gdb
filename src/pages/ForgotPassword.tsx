import React, { useState } from 'react';
import {
    Box,
    Container,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Button,
    Stack,
    Alert,
    AlertIcon,
    Text,
    Link,
    HStack,
    useClipboard,
    useColorModeValue,
    IconButton,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';

const CopyButton: React.FC<{ link: string }> = ({ link }) => {
    const { hasCopied, onCopy } = useClipboard(link);
    return (
        <IconButton
            size="sm"
            aria-label={hasCopied ? 'Copié' : 'Copier le lien'}
            onClick={onCopy}
            icon={<CopyIcon />}
        />
    );
};
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
        const [isError, setIsError] = useState(false);
        const [debugLink, setDebugLink] = useState<string | null>(null);
    const navigate = useNavigate();

    const bgCard = useColorModeValue('white', 'gray.800');

    const validateEmail = (value: string) => {
        // Simple email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsError(false);

        if (!validateEmail(email)) {
            setIsError(true);
            setMessage('Veuillez saisir une adresse email valide.');
            return;
        }

        setIsLoading(true);
            try {
                const res = await apiClient.post('/auth/forgot-password', { email });
                // apiClient.request returns parsed JSON body. Use properties directly.
                const msg = res?.message || 'Si cette adresse est enregistrée, vous allez recevoir un email.';
                setMessage(msg);
                setIsError(false);
                if (res?.debug_link) setDebugLink(res.debug_link as string);

                // Optional: navigate to login after a short delay
                setTimeout(() => navigate('/login'), 3500);
        } catch (err: unknown) {
            const e = err as any;
            const msg = e?.response?.data?.message || e?.message || 'Une erreur est survenue, réessayez plus tard.';
            setMessage(msg);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box minH="70vh" display="flex" alignItems="center" justifyContent="center" p={4}>
            <Container maxW="md" py={8}>
                <Box bg={bgCard} p={8} rounded="md" shadow="sm" borderWidth={1}>
                    <Heading as="h2" size="lg" mb={6} textAlign="center">
                        Réinitialisation du mot de passe
                    </Heading>

                                <form onSubmit={handleSubmit}>
                                    <Stack spacing={4}>
                                    {message && (
                                        <Alert status={isError ? 'error' : 'success'}>
                                            <AlertIcon />
                                            <Box>
                                                <Text>{message}</Text>
                                                {debugLink && (
                                                    <HStack mt={2} spacing={2} alignItems="center">
                                                        <Link href={debugLink} color="blue.600" isExternal>
                                                            Ouvrir le lien de réinitialisation (dev)
                                                        </Link>
                                                        <CopyButton link={debugLink} />
                                                    </HStack>
                                                )}
                                            </Box>
                                        </Alert>
                                    )}

                        <FormControl isRequired>
                            <FormLabel>Adresse email</FormLabel>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre@exemple.com"
                                aria-label="Adresse email"
                                autoComplete="email"
                            />
                        </FormControl>

                                    <Button type="submit" colorScheme="blue" w="full" isLoading={isLoading} loadingText="Envoi...">
                            Envoyer le lien de réinitialisation
                        </Button>
                                    <Button variant="link" onClick={() => navigate('/login')} justifyContent="center">
                            Retour à la connexion
                        </Button>
                                </Stack>
                                </form>
                </Box>
            </Container>
        </Box>
    );
};