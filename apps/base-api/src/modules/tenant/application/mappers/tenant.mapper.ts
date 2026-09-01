import type { TenantProps } from '../../domain/tenant.types.js';
import type {
  InstitutionProfileProps,
  TenantAddressProps,
  TenantAssetProps,
  TenantBrandingProps,
  TenantConfigurationProps,
  TenantContactProps,
  TenantIdentifierProps,
  TenantSmtpConfigurationProps,
} from '../../domain/tenant.repository.interface.js';
import type {
  InstitutionProfileResponseDto,
  TenantAddressResponseDto,
  TenantAssetResponseDto,
  TenantBrandingResponseDto,
  TenantConfigurationResponseDto,
  TenantContactResponseDto,
  TenantIdentifierResponseDto,
  TenantResponseDto,
  TenantSmtpResponseDto,
} from '../dto/response/tenant.response.dto.js';

export function toTenantResponse(props: TenantProps): TenantResponseDto {
  return { ...props } as TenantResponseDto;
}

export function toContactResponse(props: TenantContactProps): TenantContactResponseDto {
  return { ...props } as TenantContactResponseDto;
}

export function toAddressResponse(props: TenantAddressProps): TenantAddressResponseDto {
  return { ...props } as TenantAddressResponseDto;
}

export function toIdentifierResponse(props: TenantIdentifierProps): TenantIdentifierResponseDto {
  return { ...props } as TenantIdentifierResponseDto;
}

export function toConfigurationResponse(props: TenantConfigurationProps): TenantConfigurationResponseDto {
  return { ...props } as TenantConfigurationResponseDto;
}

export function toSmtpResponse(props: TenantSmtpConfigurationProps): TenantSmtpResponseDto {
  return { ...props } as TenantSmtpResponseDto;
}

export function toAssetResponse(props: TenantAssetProps): TenantAssetResponseDto {
  return { ...props } as TenantAssetResponseDto;
}

export function toInstitutionProfileResponse(props: InstitutionProfileProps): InstitutionProfileResponseDto {
  return { ...props } as InstitutionProfileResponseDto;
}

export function toBrandingResponse(props: TenantBrandingProps): TenantBrandingResponseDto {
  return { ...props } as TenantBrandingResponseDto;
}
