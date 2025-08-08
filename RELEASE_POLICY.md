# Política de Liberación de Software

## Control de Versiones Semánticas
El sistema utiliza control de versiones semánticas siguiendo la convención `MAJOR.MINOR.PATCH`.

- **MAJOR**: Cambios incompatibles con versiones anteriores.
- **MINOR**: Nuevas funcionalidades compatibles con versiones anteriores.
- **PATCH**: Corrección de errores compatibles con versiones anteriores.

### Criterios de Liberación

1. **Pruebas Exitosas**: 
   - Todas las pruebas automatizadas deben pasar exitosamente.
   - Las pruebas unitarias y de integración son obligatorias.

2. **Aprobación de Revisión**:
   - El código debe ser aprobado por al menos dos revisores.


3. **Firma de Liberación por QA**:
   - QA debe validar y firmar la liberación de la versión.

### Flujo de Liberación

1. El código debe ser fusionado desde un Pull Request (PR) hacia la rama `main`.
2. La generación de la nueva versión debe incluir la ejecución del pipeline de CI/CD, que realizará pruebas, compilación, despliegue simulado y registro de versión.

