#!/bin/sh
# Carrega variaveis simples do .env, preservando valores com espacos.
while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
        ''|[[:space:]]*|\#*) continue ;;
    esac
    case "$line" in
        *=*)
            key=${line%%=*}
            value=${line#*=}
            case "$key" in
                ''|*[!A-Za-z0-9_]*) continue ;;
            esac
            export "$key=$value"
            ;;
    esac
done < ./.env
