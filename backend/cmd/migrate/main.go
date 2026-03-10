package main

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	ctx := context.Background()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL est requise")
		os.Exit(1)
	}

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Erreur connexion: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(ctx)

	sqlFile := "migrations/001_initial_schema.sql"
	if len(os.Args) > 1 {
		sqlFile = os.Args[1]
	}

	sql, err := os.ReadFile(sqlFile)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Erreur lecture fichier: %v\n", err)
		os.Exit(1)
	}

	_, err = conn.Exec(ctx, string(sql))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Erreur exécution SQL: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Migration appliquée avec succès !")
}
