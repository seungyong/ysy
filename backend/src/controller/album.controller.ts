import dayjs from "dayjs";
import { ListResult, StorageReference } from "firebase/storage";
import { File } from "formidable";

import ForbiddenError from "../error/forbidden";
import NotFoundError from "../error/notFound";

import sequelize from "../model";
import { Album, ICreate, IRequestGet, IRequestUpadteThumbnail, IRequestUpadteTitle, IResponse } from "../model/album.model";
import { ErrorImage } from "../model/errorImage.model";

import logger from "../logger/logger";
import { deleteFile, deleteFolder, getAllFiles, getFiles, uploadFile } from "../util/firebase";

const folderName = "couples";

const controller = {
    /**
     * 앨범 폴더를 가져옵니다.
     * @param cupId Couple Id
     * @returns A {@link Album}
     */
    getAlbumsFolder: async (cupId: string): Promise<Album[]> => {
        const albums: Album[] = await Album.findAll({
            where: { cupId: cupId }
        });

        if (albums.length <= 0) throw new NotFoundError("Not Found Albums");

        return albums;
    },
    /**
     * 한 앨범의 목록을 가져옵니다.
     * @param data A {@link IRequestGet}
     * @returns A {@link IResponse}
     */
    getAlbums: async (data: IRequestGet): Promise<IResponse> => {
        const album: Album | null = await Album.findOne({
            where: {
                cupId: data.cupId,
                albumId: data.albumId
            }
        });

        if (!album) throw new NotFoundError("Not Found Albums");

        const refName = `${folderName}/${data.cupId}/${data.albumId}`;
        const firebaseResult: ListResult = await getFiles(refName, data.count, data.nextPageToken);
        const files: StorageReference[] = firebaseResult.items;
        const nextPageToken: string | undefined = firebaseResult.nextPageToken;

        if (files.length <= 0) throw new NotFoundError("Not Found Error");

        const items: string[] = [];

        files.forEach((file) => {
            items.push(file.fullPath);
        });

        const result: IResponse = {
            ...album.dataValues,
            items: items,
            nextPageToken: nextPageToken
        };

        return result;
    },
    /**
     * 앨범 폴더를 만듭니다.
     *
     * @param data A {@link IRequestCreate}
     */
    addAlbumFolder: async (data: ICreate): Promise<void> => {
        await Album.create(data);
        logger.debug(`Create Data => ${JSON.stringify(data)}`);
    },
    /**
     * 앨범 폴더에 하나 또는 여러 개의 이미지를 추가합니다.
     * @param cupId Couple Id
     * @param albumId Album Id
     * @param files 앨범 이미지 파일
     */
    addAlbums: async (cupId: string, albumId: number, files: File | File[]): Promise<void> => {
        const albumFolder = await Album.findByPk(albumId);

        if (!albumFolder) throw new NotFoundError("Not Found Error");
        else if (albumFolder.cupId !== cupId) throw new ForbiddenError("Forbidden Error");

        if (files instanceof Array<File>) {
            for (let i = 0; i < files.length; i++) {
                try {
                    const fileName = `/${cupId}/${albumId}/${dayjs().valueOf()}.${files[i].originalFilename}`;
                    await uploadFile(fileName, folderName, files[i].filepath);
                } catch (error) {
                    logger.error(`Add album error and ignore => ${JSON.stringify(error)}`);
                    continue;
                }
            }
        } else if (files instanceof File) {
            const fileName = `/${cupId}/${albumId}/${dayjs().valueOf()}.${files.originalFilename}`;
            await uploadFile(fileName, folderName, files.filepath);
        }

        logger.debug(`Success add albums => ${cupId}, ${albumId}, ${JSON.stringify(files)}`);
    },
    /**
     * 앨범 폴더명을 수정합니다.
     * @param data A {@link IRequestUpadteTitle}
     */
    updateTitle: async (data: IRequestUpadteTitle): Promise<void> => {
        const albumFolder = await Album.findByPk(data.albumId);

        if (!albumFolder) throw new NotFoundError("Not Found Error");
        else if (albumFolder.cupId !== data.cupId) throw new ForbiddenError("Forbidden Error");

        await albumFolder.update({
            title: data.title
        });

        logger.debug(`Update Data => ${JSON.stringify(data)}`);
    },
    /**
     * 앨범 대표 사진을 수정 또는 추가합니다.
     * @param data A {@link IRequestUpadteThumbnail}
     */
    updateThumbnail: async (data: IRequestUpadteThumbnail): Promise<void> => {
        let isUpload = false;
        const path = `/${data.cupId}/${data.albumId}/thumbnail/${dayjs().valueOf()}.${data.thumbnail.originalFilename}`;
        const albumFolder = await Album.findByPk(data.albumId);

        if (!albumFolder) throw new NotFoundError("Not Found Error");
        else if (albumFolder.cupId !== data.cupId) throw new ForbiddenError("Forbidden Error");

        const prevThumbnail: string | null = albumFolder.thumbnail;
        const t = await sequelize.transaction();

        try {
            await albumFolder.update(
                {
                    thumbnail: path
                },
                { transaction: t }
            );
            await uploadFile(path, folderName, data.thumbnail.filepath);
            isUpload = true;
            logger.debug(`Update Data => ${JSON.stringify(data)}`);

            if (prevThumbnail) {
                await deleteFile(prevThumbnail, folderName);
                logger.debug(`Deleted already image => ${prevThumbnail}`);
            }

            t.commit();
        } catch (error) {
            t.rollback();

            if (isUpload) {
                await deleteFile(path, folderName);
                logger.error(`After updating the firebase, a db error occurred and the firebase image is deleted => ${path}`);
            }
        }
    },
    /**
     * 앨범을 삭제합니다.
     * @param cupId Couple ID
     * @param albumId Album ID
     */
    deleteAlbum: async (cupId: string, albumId: number): Promise<void> => {
        const albumFolder = await Album.findByPk(albumId);

        if (!albumFolder) throw new NotFoundError("Not Found Error");
        else if (albumFolder.cupId !== cupId) throw new ForbiddenError("Forbidden Error");

        await albumFolder.destroy();

        if (albumFolder.thumbnail) await deleteFile(albumFolder.thumbnail, folderName);

        const path = `/${cupId}/${albumId}`;
        await deleteFolder(path, folderName);
        const images = await getAllFiles(path, folderName);

        // 지워지지 않은 이미지가 존재할 시
        if (images.items.length) {
            images.items.forEach(async (image) => {
                logger.warn(`Image not deleted : ${cupId} | ${albumId} => ${image.fullPath}`);

                await ErrorImage.create({
                    albumId: albumId,
                    thumbnail: image.fullPath
                });
            });
        }

        logger.debug(`Success Deleted albums => ${cupId}, ${albumId}`);
    }
};

export default controller;
