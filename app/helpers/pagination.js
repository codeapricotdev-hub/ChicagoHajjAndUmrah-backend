const parsePaginationParams = (query = {}, defaultLimit = 10, maxLimit = 100) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

const buildPaginationMeta = (page, limit, total) => {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
        page,
        limit,
        total,
        totalPages,
    };
};

const paginatedResponse = (list, page, limit, total) => ({
    list,
    pagination: buildPaginationMeta(page, limit, total),
});

module.exports = {
    parsePaginationParams,
    buildPaginationMeta,
    paginatedResponse,
};
