import { KEY_AUTH } from "@/constants/constants";
import { CustomError } from "./exception";
import { DB_deleteValue, DB_getValue } from "./storage";

const DOMAIN = "https://hsk.hcmue.edu.vn";
const BASE_URL = DOMAIN + "/v1/api";

export interface ApiResponse {
  status: "error" | "success";
  data: object;
  message: string;
  success: boolean;
}

/**
 * This tool maybe use primarily get and post request
 */

async function get(params: string): Promise<ApiResponse> {
  try {
    const header = await getAuthHeader();

    const response = await fetch(BASE_URL + params, {
      method: "GET",
      headers: header,
    });

    const rawStatus = response.status;

    const res = await response.json();

    console.log("get response for " + params + ":", res);

    const status = res?.status;
    if (status !== undefined && status !== null && status === "error") {
      throw new CustomError(res?.message, rawStatus, status);
    }

    const success = res?.success;
    if (success !== undefined && success !== null && success === false) {
      throw new CustomError(res?.message, rawStatus, status);
    }

    if (rawStatus >= 400 && rawStatus < 500) {
      throw new CustomError(res?.message, rawStatus, status);
    }

    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function post(
  params: string,
  options?: object | null,
): Promise<ApiResponse> {
  try {
    const header = await getAuthHeader();
    header["Content-Type"] = "application/json";

    const response = await fetch(BASE_URL + params, {
      method: "POST",
      headers: header,
      body: JSON.stringify(options),
    });

    const res = await response.json();

    console.log("post response for " + params + ":", res);

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }
    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function patch(
  params: string,
  options?: object | null,
): Promise<ApiResponse> {
  try {
    const header = await getAuthHeader();
    header["Content-Type"] = "application/json";

    const response = await fetch(BASE_URL + params, {
      method: "PATCH",
      headers: header,
      body: JSON.stringify(options),
    });

    const res = await response.json();

    console.log("patch response for " + params + ":", res);

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }
    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function del(params: string): Promise<ApiResponse> {
  try {
    const header = await getAuthHeader();
    header["Content-Type"] = "application/json";

    const response = await fetch(BASE_URL + params, {
      method: "DELETE",
      headers: header,
    });

    const res = await response.json();

    console.log("del response for " + params + ":", res);

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }
    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function postImage({
  params,
  files,
  isMultiple = false,
}: {
  params: string;
  files: File[];
  isMultiple: boolean;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();

    if (isMultiple) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    } else {
      formData.append("file", files[0]);
    }

    const header = await getAuthHeader();

    const response = await fetch(BASE_URL + params, {
      method: "POST",
      headers: header,
      body: formData,
    });

    const res = await response.json();

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }
    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function getAuthHeader() {
  const token = await DB_getValue(KEY_AUTH.TOKEN);
  let header = {};
  if (token) {
    header = {
      //   Authorization: `Bearer ${token}`,
    };
  }

  return header;
}

async function clearAuth() {
  await DB_deleteValue(KEY_AUTH.TOKEN);
  location.reload();
}

function handleError(error: CustomError) {}

export { get, post, patch, del, postImage };
