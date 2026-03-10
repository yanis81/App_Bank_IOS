package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
)

// Service fournit le chiffrement AES-256-GCM pour les tokens bancaires.
type Service struct {
	key []byte
}

// New crée un nouveau service de chiffrement à partir d'une clé hexadécimale (64 caractères = 32 bytes).
func New(hexKey string) (*Service, error) {
	key, err := hex.DecodeString(hexKey)
	if err != nil {
		return nil, fmt.Errorf("clé de chiffrement invalide (hex): %w", err)
	}
	if len(key) != 32 {
		return nil, fmt.Errorf("la clé doit faire 32 bytes (64 hex), reçu %d bytes", len(key))
	}
	return &Service{key: key}, nil
}

// Encrypt chiffre un texte en clair avec AES-256-GCM.
// Retourne le résultat en hexadécimal : nonce (24 hex) + ciphertext.
func (s *Service) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", fmt.Errorf("création cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("création GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("génération nonce: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(ciphertext), nil
}

// Decrypt déchiffre un texte chiffré en hexadécimal avec AES-256-GCM.
func (s *Service) Decrypt(hexCiphertext string) (string, error) {
	data, err := hex.DecodeString(hexCiphertext)
	if err != nil {
		return "", fmt.Errorf("décodage hex: %w", err)
	}

	block, err := aes.NewCipher(s.key)
	if err != nil {
		return "", fmt.Errorf("création cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("création GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("données chiffrées trop courtes")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("déchiffrement: %w", err)
	}

	return string(plaintext), nil
}
