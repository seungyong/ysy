import NoticeSerivce from "../service/notice.service";

import NotFoundError from "../error/notFound";

import { Notice } from "../model/notice.model";

class NoticeController {
    private noticeService: NoticeSerivce;

    constructor(noticeService: NoticeSerivce) {
        this.noticeService = noticeService;
    }

    async getNotices(count: number, page: number): Promise<Notice[]> {
        const offset: number = (page - 1) * count;
        const notices: Notice[] = await this.noticeService.selectAll(offset, count);
        if (notices.length <= 0) throw new NotFoundError("Not found notice");

        return notices;
    }
}

export default NoticeController;
