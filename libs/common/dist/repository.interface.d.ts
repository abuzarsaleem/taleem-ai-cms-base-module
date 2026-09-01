export interface IRepository<T, ID = string> {
    findById(id: ID): Promise<T | null>;
    save(entity: T): Promise<T>;
    delete(id: ID): Promise<void>;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
export interface PaginationOptions {
    page?: number;
    limit?: number;
}
