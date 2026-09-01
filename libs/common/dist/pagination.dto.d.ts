export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
}
export declare class PaginationMetaDto {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare function buildPaginationMeta(total: number, page: number, limit: number): PaginationMetaDto;
export declare function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): {
    data: T[];
    meta: PaginationMetaDto;
};
